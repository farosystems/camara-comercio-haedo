"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Eye, Save, X, Building2, Banknote, FileText, Search, User, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getArgentinaDateString, formatDateForDisplay } from "@/lib/date-utils"
import { useUser } from "@clerk/nextjs"

// Interfaces
interface Cuenta {
  id: number
  nombre: string
  descripcion: string | null
  tipo: 'Bancaria' | 'Efectivo' | 'Otro'
  numero_cuenta: string | null
  banco: string | null
  activo: boolean
  saldo_inicial: number
  created_at: string
  updated_at: string
}

interface ConceptoMovimiento {
  id: number
  nombre: string
  descripcion: string | null
  tipo: 'Ingreso' | 'Egreso'
  categoria: string | null
  activo: boolean
}

interface Proveedor {
  id: number
  razon_social: string
  nombre: string | null
  apellido: string | null
  email: string | null
  telefono: string | null
  estado: 'Activo' | 'Inactivo'
  created_at: string
  updated_at: string
}

interface MovimientoCaja {
  id: number
  fk_id_cuenta: number
  fecha: string
  concepto_ingreso: string
  apellido_nombres: string | null
  fk_id_proveedor: number | null
  numero_comprobante: string | null
  nota: string | null
  fk_id_concepto: number
  tipo: 'Ingreso' | 'Egreso'
  ingresos: number
  observaciones: string | null
  fk_id_usuario: string | null
  cuenta?: { nombre: string }
  concepto?: { nombre: string }
  proveedor?: { razon_social: string }
  usuario?: { nombre: string }
}

export function MovementsModule() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("cuentas")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Estados para datos
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [conceptos, setConceptos] = useState<ConceptoMovimiento[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([])
  const [cajasAbiertas, setCajasAbiertas] = useState<any[]>([])

  // Estados para formularios
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentForm, setCurrentForm] = useState<'cuenta' | 'concepto' | 'movimiento' | 'proveedor'>('cuenta')

  // Estados para búsqueda de proveedores
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState("")
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [showProveedorSearch, setShowProveedorSearch] = useState(false)

  // Formulario de cuenta
  const [cuentaForm, setCuentaForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "Bancaria" as 'Bancaria' | 'Efectivo' | 'Otro',
    numero_cuenta: "",
    banco: "",
    saldo_inicial: 0
  })

  // Formulario de movimiento
  const [movimientoForm, setMovimientoForm] = useState({
    fk_id_cuenta: 0,
    fecha: getArgentinaDateString(),
    concepto_ingreso: "",
    apellido_nombres: "",
    fk_id_proveedor: null as number | null,
    numero_comprobante: "",
    nota: "",
    fk_id_concepto: 0,
    tipo: "Ingreso" as 'Ingreso' | 'Egreso',
    ingresos: 0,
    observaciones: "",
    fk_id_usuario: user?.id || "",
    caja_destino: "" // Campo que no viaja al servidor
  })

  // Formulario de proveedor
  const [proveedorForm, setProveedorForm] = useState({
    razon_social: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    estado: "Activo" as 'Activo' | 'Inactivo'
  })

  // Formulario de concepto
  const [conceptoForm, setConceptoForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "Ingreso" as 'Ingreso' | 'Egreso',
    categoria: ""
  })

  // Estados para reportes
  const [reportForm, setReportForm] = useState({
    cuenta_id: 0,
    fecha_desde: getArgentinaDateString(),
    fecha_hasta: getArgentinaDateString()
  })

  const resetCuentaForm = () => {
    setCuentaForm({
      nombre: "",
      descripcion: "",
      tipo: "Bancaria",
      numero_cuenta: "",
      banco: "",
      saldo_inicial: 0
    })
  }

  const resetMovimientoForm = () => {
    setMovimientoForm({
      fk_id_cuenta: 0,
      fecha: getArgentinaDateString(),
      concepto_ingreso: "",
      apellido_nombres: "",
      fk_id_proveedor: null,
      numero_comprobante: "",
      nota: "",
      fk_id_concepto: 0,
      tipo: "Ingreso",
      ingresos: 0,
      observaciones: "",
      fk_id_usuario: user?.id || "",
      caja_destino: ""
    })
    setSelectedProveedor(null)
    setProveedorSearchTerm("")
    setShowProveedorSearch(false)
  }

  const resetProveedorForm = () => {
    setProveedorForm({
      razon_social: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      estado: "Activo"
    })
  }

  const resetConceptoForm = () => {
    setConceptoForm({
      nombre: "",
      descripcion: "",
      tipo: "Ingreso",
      categoria: ""
    })
  }

  const openDialog = (form: 'cuenta' | 'concepto' | 'movimiento' | 'proveedor', editMode = false) => {
    setCurrentForm(form)
    setIsEditMode(editMode)
    if (!editMode) {
      if (form === 'cuenta') resetCuentaForm()
      else if (form === 'concepto') resetConceptoForm()
      else if (form === 'movimiento') resetMovimientoForm()
      else if (form === 'proveedor') resetProveedorForm()
    }
    setIsDialogOpen(true)
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadMovimientos = async () => {
    try {
      const movimientosResponse = await fetch('/api/movimientos-caja')
      if (movimientosResponse.ok) {
        const movimientosData = await movimientosResponse.json()
        setMovimientosCaja(movimientosData.movimientos || [])
      }
    } catch (err) {
      console.error("Error cargando movimientos:", err)
    }
  }

  const loadCajasAbiertas = async () => {
    try {
      const response = await fetch('/api/lotes-operaciones?abierto=true&todos=true&excluir_usuario=true')
      if (response.ok) {
        const data = await response.json()
        setCajasAbiertas(data.lotes || [])
      }
    } catch (err) {
      console.error("Error cargando cajas abiertas:", err)
    }
  }

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Cargar cuentas desde la API
      const cuentasResponse = await fetch('/api/cuentas/list')
      if (cuentasResponse.ok) {
        const cuentasData = await cuentasResponse.json()
        setCuentas(cuentasData.cuentas || [])
      }

      // Cargar conceptos desde la base de datos
      const conceptosResponse = await fetch('/api/conceptos')
      if (conceptosResponse.ok) {
        const conceptosData = await conceptosResponse.json()
        setConceptos(conceptosData.conceptos || [])
      }

      // Cargar proveedores desde la base de datos
      const proveedoresResponse = await fetch('/api/proveedores')
      if (proveedoresResponse.ok) {
        const proveedoresData = await proveedoresResponse.json()
        setProveedores(proveedoresData.proveedores || [])
      }

      // Cargar movimientos
      await loadMovimientos()

      // Cargar cajas abiertas
      await loadCajasAbiertas()
    } catch (err) {
      console.error("Error cargando datos:", err)
      setError("Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCuenta = async () => {
    try {
      setLoading(true)
      
      // Validar campos obligatorios
      if (!cuentaForm.nombre.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre de la cuenta es obligatorio",
          variant: "destructive"
        })
        return
      }

      // Llamar a la API para crear cuenta
      const response = await fetch('/api/cuentas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cuentaForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando la cuenta')
      }

      toast({
        title: "Cuenta guardada",
        description: "La cuenta se guardó exitosamente"
      })
      setIsDialogOpen(false)
      resetCuentaForm()
      await loadInitialData()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error guardando la cuenta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMovimiento = async () => {
    try {
      setLoading(true)

      // Validaciones
      if (movimientoForm.ingresos <= 0) {
        toast({
          title: "Error de validación",
          description: "El monto debe ser mayor a 0",
          variant: "destructive"
        })
        return
      }

      if (!movimientoForm.fk_id_cuenta || !movimientoForm.concepto_ingreso || !movimientoForm.fk_id_concepto) {
        toast({
          title: "Error de validación",
          description: "Faltan campos obligatorios",
          variant: "destructive"
        })
        return
      }

      // Preparar datos del movimiento (sin el campo caja_destino)
      const { caja_destino, ...movimientoData } = movimientoForm

      let response
      let result
      if (caja_destino) {
        // Es una transferencia entre cajas - llamar al endpoint especial
        console.log('Transferencia entre cajas:', { movimientoData, caja_destino })
        response = await fetch('/api/movimientos-caja/transferencia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...movimientoData,
            caja_destino_id: caja_destino
          }),
        })
        result = await response.json()

        if (!response.ok) {
          console.error('Error de API en transferencia:', result)
          throw new Error(result.error || 'Error procesando la transferencia')
        }

        toast({
          title: "Transferencia realizada",
          description: "Se generó el egreso y el ingreso exitosamente"
        })
      } else {
        // Movimiento normal
        console.log('Movimiento normal:', movimientoData)
        response = await fetch('/api/movimientos-caja', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(movimientoData),
        })
        result = await response.json()

        if (!response.ok) {
          console.error('Error de API:', result)
          throw new Error(result.error || 'Error creando el movimiento')
        }

        toast({
          title: "Movimiento guardado",
          description: "El movimiento se guardó exitosamente"
        })
      }
      setIsDialogOpen(false)
      resetMovimientoForm()
      await loadMovimientos() // Cargar solo movimientos para mejor performance
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error guardando el movimiento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProveedor = async () => {
    try {
      setLoading(true)

      // Validar campos obligatorios
      if (!proveedorForm.razon_social.trim()) {
        toast({
          title: "Error de validación",
          description: "La razón social es obligatoria",
          variant: "destructive"
        })
        return
      }

      // Llamar a la API para crear proveedor
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedorForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando el proveedor')
      }

      toast({
        title: "Proveedor guardado",
        description: "El proveedor se guardó exitosamente"
      })
      setIsDialogOpen(false)
      resetProveedorForm()
      await loadInitialData() // Recargar proveedores
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error guardando el proveedor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConcepto = async () => {
    try {
      setLoading(true)

      // Validar campos obligatorios
      if (!conceptoForm.nombre.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre del concepto es obligatorio",
          variant: "destructive"
        })
        return
      }

      // Llamar a la API para crear concepto
      const response = await fetch('/api/conceptos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conceptoForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando el concepto')
      }

      toast({
        title: "Concepto guardado",
        description: "El concepto se guardó exitosamente"
      })
      setIsDialogOpen(false)
      resetConceptoForm()
      await loadInitialData() // Recargar conceptos
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error guardando el concepto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      setLoading(true)
      if (!reportForm.cuenta_id) {
        toast({
          title: "Error",
          description: "Selecciona una cuenta para generar el reporte",
          variant: "destructive"
        })
        return
      }

      // Obtener información de la cuenta
      const cuenta = cuentas.find(c => c.id === reportForm.cuenta_id)
      if (!cuenta) {
        toast({
          title: "Error",
          description: "Cuenta no encontrada",
          variant: "destructive"
        })
        return
      }

      // Filtrar movimientos por cuenta y rango de fechas
      const movimientosFiltrados = movimientosCaja.filter(m => {
        const fechaMovimiento = new Date(m.fecha)
        const fechaDesde = new Date(reportForm.fecha_desde)
        const fechaHasta = new Date(reportForm.fecha_hasta)

        return m.fk_id_cuenta === reportForm.cuenta_id &&
               fechaMovimiento >= fechaDesde &&
               fechaMovimiento <= fechaHasta
      }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

      // Obtener detalles de lotes relacionados con esta cuenta
      const response = await fetch('/api/detalle-lotes?todos=true')
      let detallesLotes: any[] = []
      if (response.ok) {
        const data = await response.json()
        detallesLotes = (data.detalles || []).filter((d: any) => {
          const fechaMovimiento = new Date(d.fecha_movimiento)
          const fechaDesde = new Date(reportForm.fecha_desde)
          const fechaHasta = new Date(reportForm.fecha_hasta)

          return d.fk_id_cuenta_tesoreria === reportForm.cuenta_id &&
                 fechaMovimiento >= fechaDesde &&
                 fechaMovimiento <= fechaHasta
        })
      }

      // Calcular totales
      const totalIngresos = movimientosFiltrados
        .filter(m => m.tipo === 'Ingreso')
        .reduce((sum, m) => sum + parseFloat(m.ingresos?.toString() || '0'), 0)

      const totalEgresos = movimientosFiltrados
        .filter(m => m.tipo === 'Egreso')
        .reduce((sum, m) => sum + parseFloat(m.ingresos?.toString() || '0'), 0)

      const totalIngresosLotes = detallesLotes
        .filter((d: any) => d.tipo === 'ingreso')
        .reduce((sum: number, d: any) => sum + parseFloat(d.monto?.toString() || '0'), 0)

      const totalEgresosLotes = detallesLotes
        .filter((d: any) => d.tipo === 'egreso')
        .reduce((sum: number, d: any) => sum + parseFloat(d.monto?.toString() || '0'), 0)

      // Generar PDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')

      // Header
      doc.setFillColor(41, 128, 185)
      doc.rect(0, 0, 210, 40, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('CÁMARA HAEDO', 20, 20)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Reporte de Tesorería', 20, 30)

      doc.setFontSize(10)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 150, 30)

      let yPos = 55

      // Información de la cuenta
      doc.setFillColor(236, 240, 241)
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DE LA CUENTA', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Cuenta:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(cuenta.nombre, 60, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Tipo:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(cuenta.tipo, 60, yPos)

      if (cuenta.banco) {
        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Banco:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(cuenta.banco, 60, yPos)
      }

      if (cuenta.numero_cuenta) {
        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Número de Cuenta:', 20, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(cuenta.numero_cuenta, 60, yPos)
      }

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Período:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`${formatDateForDisplay(reportForm.fecha_desde)} - ${formatDateForDisplay(reportForm.fecha_hasta)}`, 60, yPos)

      yPos += 15

      // Calcular totales consolidados
      const totalIngresosConsolidado = totalIngresos + totalIngresosLotes
      const totalEgresosConsolidado = totalEgresos + totalEgresosLotes
      const saldoFinalConsolidado = totalIngresosConsolidado - totalEgresosConsolidado

      // Resumen Financiero Consolidado
      doc.setFillColor(236, 240, 241)
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN FINANCIERO', 20, yPos + 5)

      yPos += 15
      doc.setFontSize(10)

      // Tabla de resumen
      doc.setFont('helvetica', 'bold')
      doc.text('Origen', 20, yPos)
      doc.text('Ingresos', 80, yPos)
      doc.text('Egresos', 120, yPos)
      doc.text('Saldo', 165, yPos)

      yPos += 3
      doc.setLineWidth(0.1)
      doc.line(15, yPos, 195, yPos)
      yPos += 5

      // Tesorería
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(52, 73, 94)
      doc.text('Tesorería', 20, yPos)
      doc.setTextColor(39, 174, 96)
      doc.text(`$${totalIngresos.toLocaleString()}`, 80, yPos)
      doc.setTextColor(231, 76, 60)
      doc.text(`$${totalEgresos.toLocaleString()}`, 120, yPos)
      const saldoTesoreria = totalIngresos - totalEgresos
      doc.setTextColor(saldoTesoreria >= 0 ? 39 : 231, saldoTesoreria >= 0 ? 174 : 76, saldoTesoreria >= 0 ? 96 : 60)
      doc.text(`$${saldoTesoreria.toLocaleString()}`, 165, yPos)

      yPos += 5

      // Cajas
      doc.setTextColor(52, 73, 94)
      doc.text('Cajas', 20, yPos)
      doc.setTextColor(39, 174, 96)
      doc.text(`$${totalIngresosLotes.toLocaleString()}`, 80, yPos)
      doc.setTextColor(231, 76, 60)
      doc.text(`$${totalEgresosLotes.toLocaleString()}`, 120, yPos)
      const saldoCajas = totalIngresosLotes - totalEgresosLotes
      doc.setTextColor(saldoCajas >= 0 ? 39 : 231, saldoCajas >= 0 ? 174 : 76, saldoCajas >= 0 ? 96 : 60)
      doc.text(`$${saldoCajas.toLocaleString()}`, 165, yPos)

      yPos += 5

      // Línea separadora para totales
      doc.setLineWidth(0.3)
      doc.setDrawColor(52, 73, 94)
      doc.line(15, yPos, 195, yPos)
      yPos += 5

      // Totales
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(52, 73, 94)
      doc.text('TOTAL', 20, yPos)
      doc.setTextColor(39, 174, 96)
      doc.text(`$${totalIngresosConsolidado.toLocaleString()}`, 80, yPos)
      doc.setTextColor(231, 76, 60)
      doc.text(`$${totalEgresosConsolidado.toLocaleString()}`, 120, yPos)
      doc.setTextColor(saldoFinalConsolidado >= 0 ? 39 : 231, saldoFinalConsolidado >= 0 ? 174 : 76, saldoFinalConsolidado >= 0 ? 96 : 60)
      doc.text(`$${saldoFinalConsolidado.toLocaleString()}`, 165, yPos)

      yPos += 15

      // Unificar y ordenar todos los movimientos
      const todosLosMovimientos: any[] = []

      // Agregar movimientos de tesorería
      movimientosFiltrados.forEach((mov) => {
        todosLosMovimientos.push({
          fecha: new Date(mov.fecha),
          fechaDisplay: formatDateForDisplay(mov.fecha),
          origen: 'Tesorería',
          concepto: mov.concepto_ingreso,
          detalle: mov.proveedor?.razon_social || mov.apellido_nombres || '-',
          tipo: mov.tipo,
          monto: parseFloat(mov.ingresos?.toString() || '0')
        })
      })

      // Agregar movimientos de cajas
      detallesLotes.forEach((det: any) => {
        todosLosMovimientos.push({
          fecha: new Date(det.fecha_movimiento),
          fechaDisplay: formatDateForDisplay(det.fecha_movimiento),
          origen: 'Caja',
          concepto: det.concepto || 'N/A',
          detalle: det.observaciones || '-',
          tipo: det.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
          monto: parseFloat(det.monto || 0)
        })
      })

      // Ordenar por fecha
      todosLosMovimientos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

      // Tabla unificada de movimientos
      if (todosLosMovimientos.length > 0) {
        doc.setTextColor(52, 73, 94)
        doc.setFillColor(236, 240, 241)
        doc.rect(15, yPos, 180, 8, 'F')
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('DETALLE DE MOVIMIENTOS', 20, yPos + 5)

        yPos += 15

        // Headers
        doc.setFontSize(8)
        doc.text('Fecha', 20, yPos)
        doc.text('Origen', 40, yPos)
        doc.text('Concepto', 60, yPos)
        doc.text('Detalle', 105, yPos)
        doc.text('Tipo', 145, yPos)
        doc.text('Monto', 170, yPos)

        yPos += 3
        doc.setLineWidth(0.1)
        doc.line(15, yPos, 195, yPos)
        yPos += 4

        // Datos
        doc.setFont('helvetica', 'normal')
        todosLosMovimientos.forEach((mov) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }

          doc.setTextColor(52, 73, 94)
          doc.text(mov.fechaDisplay, 20, yPos)

          // Origen con color distintivo
          doc.setFontSize(7)
          doc.setTextColor(100, 100, 100)
          doc.text(mov.origen, 40, yPos)
          doc.setFontSize(8)
          doc.setTextColor(52, 73, 94)

          const concepto = mov.concepto.length > 20 ? mov.concepto.substring(0, 20) + '...' : mov.concepto
          doc.text(concepto, 60, yPos)

          const detalle = mov.detalle.length > 20 ? mov.detalle.substring(0, 20) + '...' : mov.detalle
          doc.text(detalle, 105, yPos)

          doc.setTextColor(mov.tipo === 'Ingreso' ? 39 : 231, mov.tipo === 'Ingreso' ? 174 : 76, mov.tipo === 'Ingreso' ? 96 : 60)
          doc.text(mov.tipo, 145, yPos)
          doc.text(`$${mov.monto.toLocaleString()}`, 170, yPos)

          doc.setTextColor(52, 73, 94)
          yPos += 5
        })
      } else {
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(10)
        doc.text('No hay movimientos registrados en el período seleccionado', 20, yPos)
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(41, 128, 185)
        doc.rect(0, 280, 210, 17, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('Documento generado automáticamente por el Sistema de Gestión de Cámara Haedo', 20, 290)
        doc.text(`Página ${i} de ${pageCount}`, 180, 290)
      }

      // Descargar PDF
      const fileName = `reporte_tesoreria_${cuenta.nombre.replace(/\s+/g, '_')}_${reportForm.fecha_desde}_${reportForm.fecha_hasta}.pdf`
      doc.save(fileName)

      toast({
        title: "Reporte generado",
        description: "El reporte PDF se ha descargado correctamente"
      })
    } catch (err: any) {
      console.error('Error generando reporte:', err)
      toast({
        title: "Error",
        description: err.message || "Error generando el reporte",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Movimientos</h2>
          <p className="text-muted-foreground">Gestión de movimientos bancarios y efectivo</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cuentas">Cuentas y Conceptos</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        {/* Pestaña Cuentas y Conceptos */}
        <TabsContent value="cuentas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Cuentas y Conceptos</h3>
          </div>

          {/* Sección Cuentas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gestión de Cuentas
                  </CardTitle>
                  <CardDescription>Administra las cuentas bancarias y de efectivo</CardDescription>
                </div>
                <Button onClick={() => openDialog('cuenta')} className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cuenta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : cuentas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay cuentas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Banco/Descripción</TableHead>
                      <TableHead>Número Cuenta</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">{cuenta.nombre}</TableCell>
                        <TableCell>{cuenta.tipo}</TableCell>
                        <TableCell>{cuenta.banco || cuenta.descripcion}</TableCell>
                        <TableCell>{cuenta.numero_cuenta || '-'}</TableCell>
                        <TableCell>${cuenta.saldo_inicial?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={cuenta.activo ? "default" : "secondary"}>
                            {cuenta.activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sección Conceptos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Gestión de Conceptos
                  </CardTitle>
                  <CardDescription>Administra los conceptos de ingresos y egresos</CardDescription>
                </div>
                <Button onClick={() => openDialog('concepto')} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Concepto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : conceptos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay conceptos registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conceptos.map((concepto) => (
                      <TableRow key={concepto.id}>
                        <TableCell className="font-medium">{concepto.nombre}</TableCell>
                        <TableCell>
                          <Badge variant={concepto.tipo === "Ingreso" ? "default" : "destructive"}>
                            {concepto.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{concepto.categoria || '-'}</TableCell>
                        <TableCell>{concepto.descripcion || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={concepto.activo ? "default" : "secondary"}>
                            {concepto.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Proveedores */}
        <TabsContent value="proveedores" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openDialog('proveedor')} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestión de Proveedores
              </CardTitle>
              <CardDescription>Administra los proveedores y prestadores de servicios</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : proveedores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay proveedores registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores.map((proveedor) => (
                      <TableRow key={proveedor.id}>
                        <TableCell className="font-medium">{proveedor.razon_social}</TableCell>
                        <TableCell>
                          {proveedor.nombre && proveedor.apellido
                            ? `${proveedor.nombre} ${proveedor.apellido}`
                            : proveedor.nombre || proveedor.apellido || '-'}
                        </TableCell>
                        <TableCell>{proveedor.email || '-'}</TableCell>
                        <TableCell>{proveedor.telefono || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={proveedor.estado === "Activo" ? "default" : "secondary"}>
                            {proveedor.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Movimientos */}
        <TabsContent value="movimientos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openDialog('movimiento')} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Movimiento
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Movimientos
              </CardTitle>
              <CardDescription>Registro de todos los movimientos bancarios y de efectivo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Tipo Cuenta</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo/Monto</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosCaja.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">No hay movimientos registrados</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientosCaja
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((movimiento) => (
                        <TableRow key={movimiento.id}>
                          <TableCell>{formatDateForDisplay(movimiento.fecha)}</TableCell>
                          <TableCell>{movimiento.cuenta?.nombre || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={movimiento.fk_id_cuenta ? "default" : "secondary"}>
                              {cuentas.find(c => c.id === movimiento.fk_id_cuenta)?.tipo || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{movimiento.concepto_ingreso}</TableCell>
                          <TableCell>
                            {movimiento.proveedor?.razon_social || movimiento.apellido_nombres || '-'}
                          </TableCell>
                          <TableCell className={movimiento.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'}>
                            {movimiento.tipo === 'Ingreso' ? (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2"
                                style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                              >
                                Ingreso
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2"
                                style={{ backgroundColor: '#fecaca', color: '#991b1b' }}
                              >
                                Egreso
                              </span>
                            )}
                            ${movimiento.ingresos.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {movimiento.usuario?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Reportes */}
        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generar Reportes
              </CardTitle>
              <CardDescription>Genera reportes PDF de movimientos por cuenta y período</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cuenta_reporte">Cuenta</Label>
                  <Select value={reportForm.cuenta_id.toString()} onValueChange={(value) => setReportForm({...reportForm, cuenta_id: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                          {cuenta.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha_desde">Fecha Desde</Label>
                  <Input
                    id="fecha_desde"
                    type="date"
                    value={reportForm.fecha_desde}
                    onChange={(e) => setReportForm({...reportForm, fecha_desde: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha_hasta">Fecha Hasta</Label>
                  <Input
                    id="fecha_hasta"
                    type="date"
                    value={reportForm.fecha_hasta}
                    onChange={(e) => setReportForm({...reportForm, fecha_hasta: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={generateReport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  {loading ? "Generando..." : "Generar Reporte PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para formularios */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>
              {currentForm === 'cuenta' && `${isEditMode ? 'Editar' : 'Nueva'} Cuenta`}
              {currentForm === 'concepto' && `${isEditMode ? 'Editar' : 'Nuevo'} Concepto`}
              {currentForm === 'movimiento' && 'Nuevo Movimiento'}
              {currentForm === 'proveedor' && `${isEditMode ? 'Editar' : 'Nuevo'} Proveedor`}
            </DialogTitle>
            <DialogDescription>
              {currentForm === 'cuenta' && 'Completa los datos de la cuenta'}
              {currentForm === 'concepto' && 'Completa los datos del concepto'}
              {currentForm === 'movimiento' && 'Registra un nuevo movimiento bancario o de efectivo'}
              {currentForm === 'proveedor' && 'Completa los datos del proveedor'}
            </DialogDescription>
          </DialogHeader>

          {/* Formulario de Cuenta */}
          {currentForm === 'cuenta' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={cuentaForm.nombre}
                    onChange={(e) => setCuentaForm({...cuentaForm, nombre: e.target.value})}
                    placeholder="Nombre de la cuenta"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={cuentaForm.tipo} onValueChange={(value: 'Bancaria' | 'Efectivo' | 'Otro') => setCuentaForm({...cuentaForm, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bancaria">Bancaria</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {cuentaForm.tipo === 'Bancaria' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="banco">Banco</Label>
                      <Input
                        id="banco"
                        value={cuentaForm.banco}
                        onChange={(e) => setCuentaForm({...cuentaForm, banco: e.target.value})}
                        placeholder="Nombre del banco"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numero_cuenta">Número de Cuenta</Label>
                      <Input
                        id="numero_cuenta"
                        value={cuentaForm.numero_cuenta}
                        onChange={(e) => setCuentaForm({...cuentaForm, numero_cuenta: e.target.value})}
                        placeholder="Número de cuenta"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
                  <Input
                    id="saldo_inicial"
                    type="number"
                    value={cuentaForm.saldo_inicial}
                    onChange={(e) => setCuentaForm({...cuentaForm, saldo_inicial: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={cuentaForm.descripcion}
                  onChange={(e) => setCuentaForm({...cuentaForm, descripcion: e.target.value})}
                  placeholder="Descripción de la cuenta"
                />
              </div>
            </div>
          )}

          {/* Formulario de Concepto */}
          {currentForm === 'concepto' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre_concepto">Nombre *</Label>
                  <Input
                    id="nombre_concepto"
                    value={conceptoForm.nombre}
                    onChange={(e) => setConceptoForm({...conceptoForm, nombre: e.target.value})}
                    placeholder="Nombre del concepto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_concepto">Tipo *</Label>
                  <Select value={conceptoForm.tipo} onValueChange={(value: 'Ingreso' | 'Egreso') => setConceptoForm({...conceptoForm, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ingreso">Ingreso</SelectItem>
                      <SelectItem value="Egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria_concepto">Categoría</Label>
                  <Input
                    id="categoria_concepto"
                    value={conceptoForm.categoria}
                    onChange={(e) => setConceptoForm({...conceptoForm, categoria: e.target.value})}
                    placeholder="Categoría (ej: Servicios, Insumos)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion_concepto">Descripción</Label>
                <Textarea
                  id="descripcion_concepto"
                  value={conceptoForm.descripcion}
                  onChange={(e) => setConceptoForm({...conceptoForm, descripcion: e.target.value})}
                  placeholder="Descripción del concepto"
                />
              </div>
            </div>
          )}

          {/* Formulario de Movimiento */}
          {currentForm === 'movimiento' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cuenta">Cuenta *</Label>
                  <Select value={movimientoForm.fk_id_cuenta.toString()} onValueChange={(value) => setMovimientoForm({...movimientoForm, fk_id_cuenta: parseInt(value)})}>
                    <SelectTrigger className="truncate">
                      <SelectValue placeholder="Seleccionar cuenta" className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((cuenta) => (
                        <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                          <div className="truncate">
                            {cuenta.nombre} ({cuenta.tipo})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={movimientoForm.fecha}
                    onChange={(e) => setMovimientoForm({...movimientoForm, fecha: e.target.value})}
                  />
                </div>

                {/* Campo Caja destino - opcional */}
                <div className="space-y-2">
                  <Label htmlFor="caja_destino">Caja destino (Opcional)</Label>
                  <Select
                    value={movimientoForm.caja_destino || "none"}
                    onValueChange={(value) => {
                      const cajaSeleccionada = value === "none" ? "" : value
                      setMovimientoForm({
                        ...movimientoForm,
                        caja_destino: cajaSeleccionada,
                        tipo: cajaSeleccionada ? "Egreso" : "Ingreso", // Cambiar automáticamente el tipo
                        fk_id_concepto: cajaSeleccionada ? 4 : 0 // Fijar concepto ID=4 si hay caja destino
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar caja destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin transferencia</SelectItem>
                      {cajasAbiertas.map((lote) => (
                        <SelectItem key={lote.id_lote} value={lote.id_lote.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{lote.caja?.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              ({lote.usuario?.nombre})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {movimientoForm.caja_destino && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      ℹ️ Al seleccionar una caja destino, se generará un egreso desde su caja y un ingreso en la caja seleccionada.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concepto_ingreso">Concepto del {movimientoForm.caja_destino ? 'Egreso' : 'Ingreso'} *</Label>
                  <Input
                    id="concepto_ingreso"
                    value={movimientoForm.concepto_ingreso}
                    onChange={(e) => setMovimientoForm({...movimientoForm, concepto_ingreso: e.target.value})}
                    placeholder="Describir el concepto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                  {selectedProveedor ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-blue-900">{selectedProveedor.razon_social}</div>
                          {(selectedProveedor.nombre || selectedProveedor.apellido) && (
                            <div className="text-sm text-blue-700">
                              {selectedProveedor.nombre} {selectedProveedor.apellido}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProveedor(null)
                            setMovimientoForm({...movimientoForm, fk_id_proveedor: null})
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar proveedor por razón social..."
                          value={proveedorSearchTerm}
                          onChange={(e) => {
                            setProveedorSearchTerm(e.target.value)
                            setShowProveedorSearch(e.target.value.length > 0)
                          }}
                          className="pl-8"
                        />
                      </div>

                      {showProveedorSearch && proveedorSearchTerm && (
                        <div className="border rounded-lg max-h-40 overflow-y-auto bg-white">
                          {proveedores
                            .filter(p =>
                              p.estado === 'Activo' &&
                              p.razon_social.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                            ).length === 0 ? (
                            <div className="p-3 text-center text-muted-foreground">
                              No se encontraron proveedores
                            </div>
                          ) : (
                            proveedores
                              .filter(p =>
                                p.estado === 'Activo' &&
                                p.razon_social.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                              )
                              .slice(0, 5)
                              .map((proveedor) => (
                                <div
                                  key={proveedor.id}
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    setSelectedProveedor(proveedor)
                                    setMovimientoForm({...movimientoForm, fk_id_proveedor: proveedor.id})
                                    setProveedorSearchTerm("")
                                    setShowProveedorSearch(false)
                                  }}
                                >
                                  <div className="font-medium">{proveedor.razon_social}</div>
                                  {(proveedor.nombre || proveedor.apellido) && (
                                    <div className="text-sm text-muted-foreground">
                                      {proveedor.nombre} {proveedor.apellido}
                                    </div>
                                  )}
                                  {proveedor.email && (
                                    <div className="text-xs text-muted-foreground">{proveedor.email}</div>
                                  )}
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numero_comprobante">Nº Comprobante/Nota</Label>
                  <Input
                    id="numero_comprobante"
                    value={movimientoForm.numero_comprobante}
                    onChange={(e) => setMovimientoForm({...movimientoForm, numero_comprobante: e.target.value})}
                    placeholder="Número de comprobante"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto *</Label>
                  {movimientoForm.caja_destino ? (
                    <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-600">
                      {conceptos.find(c => c.id === 4)?.nombre || 'Transferencia entre cajas'} (Solo lectura)
                    </div>
                  ) : (
                    <Select value={movimientoForm.fk_id_concepto.toString()} onValueChange={(value) => setMovimientoForm({...movimientoForm, fk_id_concepto: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto" />
                      </SelectTrigger>
                      <SelectContent>
                        {conceptos.map((concepto) => (
                          <SelectItem key={concepto.id} value={concepto.id.toString()}>
                            {concepto.nombre} ({concepto.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Movimiento *</Label>
                  {movimientoForm.caja_destino ? (
                    <div className="bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-600">
                      Egreso (Solo lectura)
                    </div>
                  ) : (
                    <Select value={movimientoForm.tipo} onValueChange={(value: 'Ingreso' | 'Egreso') => setMovimientoForm({...movimientoForm, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ingreso">Ingreso</SelectItem>
                        <SelectItem value="Egreso">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              {/* Sección de Monto */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Monto</h4>
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto *</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={movimientoForm.ingresos}
                      onChange={(e) => setMovimientoForm({...movimientoForm, ingresos: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={movimientoForm.observaciones}
                  onChange={(e) => setMovimientoForm({...movimientoForm, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuario_nombre" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuario
                </Label>
                <Input
                  id="usuario_nombre"
                  value={
                    user?.fullName ||
                    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                    user?.username ||
                    user?.emailAddresses[0]?.emailAddress?.split('@')[0] ||
                    'Usuario no identificado'
                  }
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Email: {user?.emailAddresses[0]?.emailAddress || 'No disponible'}
                </p>
              </div>
            </div>
          )}

          {/* Formulario de Proveedor */}
          {currentForm === 'proveedor' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input
                    id="razon_social"
                    value={proveedorForm.razon_social}
                    onChange={(e) => setProveedorForm({...proveedorForm, razon_social: e.target.value})}
                    placeholder="Razón social del proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={proveedorForm.estado} onValueChange={(value: 'Activo' | 'Inactivo') => setProveedorForm({...proveedorForm, estado: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={proveedorForm.nombre}
                    onChange={(e) => setProveedorForm({...proveedorForm, nombre: e.target.value})}
                    placeholder="Nombre de contacto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={proveedorForm.apellido}
                    onChange={(e) => setProveedorForm({...proveedorForm, apellido: e.target.value})}
                    placeholder="Apellido de contacto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={proveedorForm.email}
                    onChange={(e) => setProveedorForm({...proveedorForm, email: e.target.value})}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={proveedorForm.telefono}
                    onChange={(e) => setProveedorForm({...proveedorForm, telefono: e.target.value})}
                    placeholder="011-1234-5678"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={
                currentForm === 'cuenta' ? handleSaveCuenta :
                currentForm === 'concepto' ? handleSaveConcepto :
                currentForm === 'movimiento' ? handleSaveMovimiento :
                handleSaveProveedor
              }
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}