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
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  User,
  Building2,
  FileText,
  Printer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getArgentinaDateString, formatDateForDisplay } from "@/lib/date-utils"
import { useUser } from "@clerk/nextjs"

// Interfaces
interface Caja {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

interface LoteOperaciones {
  id_lote: number
  fk_id_usuario: number
  fk_id_caja: number
  abierto: boolean
  tipo_lote: string
  fecha_apertura: string
  hora_apertura: string | null
  fecha_cierre: string | null
  hora_cierre: string | null
  observaciones: string | null
  saldo_inicial: number
  caja?: { id: number, nombre: string }
  usuario?: { nombre: string }
}

interface DetalleLote {
  idd: number
  fk_id_lote: number
  fk_id_cuenta_tesoreria: number
  tipo: 'ingreso' | 'egreso'
  monto: number
  fecha_movimiento: string
  concepto: string | null
  observaciones: string | null
  cuenta?: { nombre: string, tipo: string }
}

interface Cuenta {
  id: number
  nombre: string
  tipo: string
}

export function CashBoxModule() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("mis-cajas")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Estados para datos
  const [cajas, setCajas] = useState<Caja[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [lotes, setLotes] = useState<LoteOperaciones[]>([])
  const [loteActivo, setLoteActivo] = useState<LoteOperaciones | null>(null)
  const [detallesLote, setDetallesLote] = useState<DetalleLote[]>([])
  const [todosLosLotes, setTodosLosLotes] = useState<LoteOperaciones[]>([])
  const [todosLosDetalles, setTodosLosDetalles] = useState<DetalleLote[]>([])

  // Estados para filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroCuenta, setFiltroCuenta] = useState<string>('todas')

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 15

  // Estados para formularios
  const [isAbrirCajaOpen, setIsAbrirCajaOpen] = useState(false)
  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false)
  const [isCerrarCajaOpen, setIsCerrarCajaOpen] = useState(false)

  // Formulario abrir caja
  const [abrirCajaForm, setAbrirCajaForm] = useState({
    fk_id_caja: 0,
    saldo_inicial: 0,
    observaciones: ""
  })

  // Formulario movimiento
  const [movimientoForm, setMovimientoForm] = useState({
    fk_id_cuenta_tesoreria: 0,
    tipo: "ingreso" as 'ingreso' | 'egreso',
    monto: 0,
    concepto: "",
    observaciones: ""
  })

  // Formulario cerrar caja
  const [cerrarCajaForm, setCerrarCajaForm] = useState({
    observaciones: ""
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCajas(),
        loadCuentas(),
        loadLotes(),
        loadLoteActivo(),
        loadResumenGeneral()
      ])
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCajas = async () => {
    try {
      // Primero obtener el usuario actual para saber su caja asignada
      const userResponse = await fetch('/api/usuarios/current')
      let cajaAsignada = null

      if (userResponse.ok) {
        const userData = await userResponse.json()
        cajaAsignada = userData.usuario?.fk_id_caja
      }

      const response = await fetch('/api/cajas')
      if (response.ok) {
        const data = await response.json()
        let cajasData = data.cajas || []

        // Si el usuario tiene una caja asignada, filtrar solo esa caja
        if (cajaAsignada) {
          cajasData = cajasData.filter((caja: Caja) => caja.id === cajaAsignada)
        }

        setCajas(cajasData)
      }
    } catch (error) {
      console.error("Error cargando cajas:", error)
    }
  }

  const obtenerUltimoSaldoFinal = async (cajaId: number) => {
    try {
      // Obtener el último lote cerrado del usuario para esta caja específica
      const response = await fetch(`/api/lotes-operaciones?caja_id=${cajaId}&abierto=false`)
      if (response.ok) {
        const data = await response.json()
        const lotes = data.lotes || []

        // El primer lote es el más reciente (ordenado por fecha_apertura desc)
        if (lotes.length > 0 && lotes[0].saldo_final !== null && lotes[0].saldo_final !== undefined) {
          return lotes[0].saldo_final
        }
      }
      return 0
    } catch (error) {
      console.error("Error obteniendo último saldo:", error)
      return 0
    }
  }

  const loadCuentas = async () => {
    try {
      const response = await fetch('/api/cuentas/list')
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.cuentas || [])
      }
    } catch (error) {
      console.error("Error cargando cuentas:", error)
    }
  }

  const loadLotes = async () => {
    try {
      const response = await fetch('/api/lotes-operaciones')
      if (response.ok) {
        const data = await response.json()
        setLotes(data.lotes || [])
      }
    } catch (error) {
      console.error("Error cargando lotes:", error)
    }
  }

  const loadLoteActivo = async () => {
    try {
      const response = await fetch('/api/lotes-operaciones?abierto=true')
      if (response.ok) {
        const data = await response.json()
        const loteAbierto = data.lotes?.[0] || null
        setLoteActivo(loteAbierto)

        if (loteAbierto) {
          await loadDetallesLote(loteAbierto.id_lote)
        }
      }
    } catch (error) {
      console.error("Error cargando lote activo:", error)
    }
  }

  const loadDetallesLote = async (loteId: number) => {
    try {
      const response = await fetch(`/api/detalle-lotes?lote_id=${loteId}`)
      if (response.ok) {
        const data = await response.json()
        setDetallesLote(data.detalles || [])
      }
    } catch (error) {
      console.error("Error cargando detalles del lote:", error)
    }
  }

  const loadResumenGeneral = async () => {
    try {
      // Cargar todos los lotes (no filtrados por usuario para el resumen general)
      const lotesResponse = await fetch('/api/lotes-operaciones?todos=true')
      if (lotesResponse.ok) {
        const lotesData = await lotesResponse.json()
        console.log('Lotes cargados para resumen general:', lotesData.lotes?.length, 'lotes')
        console.log('Lotes abiertos encontrados:', lotesData.lotes?.filter((l: any) => l.abierto).length)
        setTodosLosLotes(lotesData.lotes || [])
      }

      // Cargar todos los detalles de lotes
      const detallesResponse = await fetch('/api/detalle-lotes?todos=true')
      if (detallesResponse.ok) {
        const detallesData = await detallesResponse.json()
        console.log('Detalles cargados para resumen general:', detallesData.detalles?.length, 'detalles')
        setTodosLosDetalles(detallesData.detalles || [])
      }
    } catch (error) {
      console.error("Error cargando resumen general:", error)
    }
  }

  const handleAbrirCaja = async () => {
    try {
      setLoading(true)

      if (!abrirCajaForm.fk_id_caja || abrirCajaForm.saldo_inicial < 0) {
        toast({
          title: "Error de validación",
          description: "Selecciona una caja y el saldo inicial debe ser mayor o igual a 0",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/lotes-operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(abrirCajaForm)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error abriendo caja')
      }

      toast({
        title: "Caja abierta",
        description: "La caja se abrió exitosamente"
      })

      setIsAbrirCajaOpen(false)
      setAbrirCajaForm({ fk_id_caja: 0, saldo_inicial: 0, observaciones: "" })
      await loadInitialData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error abriendo la caja",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarMovimiento = async () => {
    try {
      setLoading(true)

      if (!loteActivo || !movimientoForm.fk_id_cuenta_tesoreria || !movimientoForm.monto || movimientoForm.monto <= 0) {
        toast({
          title: "Error de validación",
          description: "Todos los campos son obligatorios y el monto debe ser mayor a 0",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/detalle-lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movimientoForm,
          fk_id_lote: loteActivo.id_lote
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error agregando movimiento')
      }

      toast({
        title: "Movimiento agregado",
        description: "El movimiento se registró exitosamente"
      })

      setIsMovimientoOpen(false)
      setMovimientoForm({
        fk_id_cuenta_tesoreria: 0,
        tipo: "ingreso",
        monto: 0,
        concepto: "",
        observaciones: ""
      })

      await loadDetallesLote(loteActivo.id_lote)

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error agregando movimiento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImprimirMovimientos = async (loteParaImprimir?: LoteOperaciones, detallesParaImprimir?: DetalleLote[]) => {
    try {
      // Usar el lote proporcionado o el lote activo
      const lote = loteParaImprimir || loteActivo
      if (!lote) return

      // Si no se proporcionan detalles, cargarlos
      let detalles = detallesParaImprimir
      if (!detalles) {
        const response = await fetch(`/api/detalle-lotes?lote_id=${lote.id_lote}`)
        if (response.ok) {
          const data = await response.json()
          detalles = data.detalles || []
        } else {
          detalles = []
        }
      }

      // Importación dinámica de jsPDF
      const { jsPDF } = await import('jspdf')

      // Crear nuevo documento PDF
      const doc = new jsPDF('p', 'mm', 'a4')

      // Header del documento
      doc.setFillColor(41, 128, 185) // Azul
      doc.rect(0, 0, 210, 40, 'F')

      // Logo/Título
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('CÁMARA HAEDO', 20, 20)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Reporte de Movimientos de Tesorería', 20, 30)

      // Fecha de generación
      doc.setFontSize(10)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 150, 30)

      let yPos = 55

      // Información del Lote
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMACIÓN DE LA CAJA', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Caja:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(lote.caja?.nombre || 'N/A'), 60, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Fecha de Apertura:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      const fechaApertura = lote.fecha_apertura ?
        new Date(lote.fecha_apertura).toLocaleDateString('es-AR') :
        'No disponible'
      doc.text(fechaApertura, 80, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Hora de Apertura:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(lote.hora_apertura || 'N/A'), 80, yPos)

      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Saldo Inicial:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`$${lote.saldo_inicial.toLocaleString()}`, 80, yPos)

      yPos += 15

      // Calcular totales para el resumen financiero
      const ingresosEfectivoPDF = (detalles || [])
        .filter(d => d.tipo?.toLowerCase() === 'ingreso' && d.cuenta?.tipo?.toLowerCase() === 'efectivo')
        .reduce((sum, d) => sum + parseFloat(d.monto?.toString() || '0'), 0)

      const egresosEfectivoPDF = (detalles || [])
        .filter(d => d.tipo?.toLowerCase() === 'egreso' && d.cuenta?.tipo?.toLowerCase() === 'efectivo')
        .reduce((sum, d) => sum + parseFloat(d.monto?.toString() || '0'), 0)

      const saldoFinalPDF = ingresosEfectivoPDF - egresosEfectivoPDF

      // Resumen Financiero
      doc.setFillColor(236, 240, 241) // Gris claro
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setTextColor(52, 73, 94) // Gris oscuro
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN FINANCIERO', 20, yPos + 5)

      yPos += 15
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.setFont('helvetica', 'bold')
      doc.text('Total Ingresos:', 20, yPos)
      doc.setTextColor(39, 174, 96)
      doc.setFont('helvetica', 'bold')
      doc.text(`$${ingresosEfectivoPDF.toLocaleString()}`, 80, yPos)

      doc.setTextColor(52, 73, 94)
      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Total Egresos:', 20, yPos)
      doc.setTextColor(231, 76, 60)
      doc.setFont('helvetica', 'bold')
      doc.text(`$${egresosEfectivoPDF.toLocaleString()}`, 80, yPos)

      doc.setTextColor(52, 73, 94)
      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('Saldo Final:', 20, yPos)
      doc.setTextColor(saldoFinalPDF >= 0 ? 39 : 231, saldoFinalPDF >= 0 ? 174 : 76, saldoFinalPDF >= 0 ? 96 : 60)
      doc.setFont('helvetica', 'bold')
      doc.text(`$${saldoFinalPDF.toLocaleString()}`, 80, yPos)

      yPos += 20

      // Resumen por Cuenta
      doc.setTextColor(52, 73, 94)
      doc.setFillColor(236, 240, 241)
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMEN POR CUENTA', 20, yPos + 5)

      yPos += 15

      // Calcular resumen por cuenta
      const resumenPorCuenta = new Map()

      ;(detalles || []).forEach(detalle => {
        const cuentaId = detalle.fk_id_cuenta_tesoreria
        const cuentaNombre = detalle.cuenta?.nombre || 'Cuenta desconocida'
        const monto = parseFloat(detalle.monto?.toString() || '0')

        if (!resumenPorCuenta.has(cuentaId)) {
          resumenPorCuenta.set(cuentaId, {
            nombre: cuentaNombre,
            ingresos: 0,
            egresos: 0,
            saldo: 0
          })
        }

        const cuenta = resumenPorCuenta.get(cuentaId)
        if (detalle.tipo === 'ingreso') {
          cuenta.ingresos += monto
        } else {
          cuenta.egresos += monto
        }
        cuenta.saldo = cuenta.ingresos - cuenta.egresos
      })

      // Mostrar headers del resumen por cuenta
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Cuenta', 20, yPos)
      doc.text('Ingresos', 80, yPos)
      doc.text('Egresos', 120, yPos)
      doc.text('Saldo', 160, yPos)

      yPos += 5
      doc.setLineWidth(0.1)
      doc.line(15, yPos, 195, yPos)
      yPos += 5

      // Mostrar datos del resumen por cuenta
      doc.setFont('helvetica', 'normal')
      resumenPorCuenta.forEach((datos, cuentaId) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }

        const nombreCuenta = datos.nombre.length > 20 ? datos.nombre.substring(0, 20) + '...' : datos.nombre
        doc.setTextColor(52, 73, 94)
        doc.text(nombreCuenta, 20, yPos)

        doc.setTextColor(39, 174, 96) // Verde para ingresos
        doc.text(`$${datos.ingresos.toLocaleString()}`, 80, yPos)

        doc.setTextColor(231, 76, 60) // Rojo para egresos
        doc.text(`$${datos.egresos.toLocaleString()}`, 120, yPos)

        doc.setTextColor(datos.saldo >= 0 ? 39 : 231, datos.saldo >= 0 ? 174 : 76, datos.saldo >= 0 ? 96 : 60)
        doc.text(`$${datos.saldo.toLocaleString()}`, 160, yPos)

        yPos += 5
      })

      yPos += 10

      // Tabla de movimientos
      doc.setTextColor(52, 73, 94)
      doc.setFillColor(236, 240, 241)
      doc.rect(15, yPos, 180, 8, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('DETALLE DE MOVIMIENTOS', 20, yPos + 5)

      yPos += 15

      // Headers de la tabla
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Hora', 20, yPos)
      doc.text('Tipo', 40, yPos)
      doc.text('Cuenta', 65, yPos)
      doc.text('Concepto', 110, yPos)
      doc.text('Monto', 170, yPos)

      yPos += 5
      doc.setLineWidth(0.1)
      doc.line(15, yPos, 195, yPos)
      yPos += 5

      // Datos de la tabla
      doc.setFont('helvetica', 'normal')
      ;(detalles || []).forEach((detalle, index) => {
        if (yPos > 270) { // Nueva página si es necesario
          doc.addPage()
          yPos = 20
        }

        doc.text(detalle.fecha_movimiento?.split('T')[1]?.slice(0, 5) || '', 20, yPos)
        doc.setTextColor(detalle.tipo === 'ingreso' ? 39 : 231, detalle.tipo === 'ingreso' ? 174 : 76, detalle.tipo === 'ingreso' ? 96 : 60)
        doc.text(detalle.tipo.toUpperCase(), 40, yPos)
        doc.setTextColor(52, 73, 94)
        const cuentaNombre = detalle.cuenta?.nombre || 'N/A'
        doc.text(cuentaNombre.length > 15 ? cuentaNombre.substring(0, 15) + '...' : cuentaNombre, 65, yPos)
        const concepto = detalle.concepto || 'Sin concepto'
        doc.text(concepto.length > 25 ? concepto.substring(0, 25) + '...' : concepto, 110, yPos)
        doc.setTextColor(detalle.tipo === 'ingreso' ? 39 : 231, detalle.tipo === 'ingreso' ? 174 : 76, detalle.tipo === 'ingreso' ? 96 : 60)
        doc.text(`$${detalle.monto.toLocaleString()}`, 170, yPos)
        doc.setTextColor(52, 73, 94)
        yPos += 5
      })

      // Footer
      yPos = 280
      doc.setFillColor(41, 128, 185)
      doc.rect(0, yPos, 210, 17, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Documento generado automáticamente por el Sistema de Gestión de Cámara Haedo', 20, yPos + 10)

      // Descargar el PDF
      const fileName = `movimientos_caja_${lote.id_lote}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF generado",
        description: "El reporte de movimientos se ha descargado correctamente",
        variant: "default",
      })

    } catch (error) {
      console.error('Error generando PDF:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      })
    }
  }

  const handleCerrarCaja = async () => {
    try {
      setLoading(true)

      if (!loteActivo) {
        toast({
          title: "Error",
          description: "No hay caja abierta para cerrar",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/lotes-operaciones/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_lote: loteActivo.id_lote,
          observaciones: cerrarCajaForm.observaciones
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error cerrando caja')
      }

      toast({
        title: "Caja cerrada",
        description: "La caja se cerró exitosamente"
      })

      setIsCerrarCajaOpen(false)
      setCerrarCajaForm({ observaciones: "" })
      setLoteActivo(null)
      setDetallesLote([])
      await loadInitialData()

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error cerrando la caja",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularTotales = () => {
    // Totales de cuentas de tipo Efectivo únicamente para el saldo final
    const ingresosEfectivo = detallesLote
      .filter(d => d.tipo?.toLowerCase() === 'ingreso' && d.cuenta?.tipo?.toLowerCase() === 'efectivo')
      .reduce((sum, d) => sum + parseFloat(d.monto.toString()), 0)

    const egresosEfectivo = detallesLote
      .filter(d => d.tipo?.toLowerCase() === 'egreso' && d.cuenta?.tipo?.toLowerCase() === 'efectivo')
      .reduce((sum, d) => sum + parseFloat(d.monto.toString()), 0)

    // El saldo final solo considera cuentas de tipo Efectivo
    const saldoFinal = ingresosEfectivo - egresosEfectivo

    return { ingresos: ingresosEfectivo, egresos: egresosEfectivo, saldoFinal }
  }

  const { ingresos, egresos, saldoFinal } = calcularTotales()

  // Función para filtrar movimientos
  const movimientosFiltrados = detallesLote.filter(detalle => {
    const cumpleTipo = filtroTipo === 'todos' || detalle.tipo?.toLowerCase() === filtroTipo.toLowerCase()
    const cumpleCuenta = filtroCuenta === 'todas' || detalle.fk_id_cuenta_tesoreria?.toString() === filtroCuenta
    return cumpleTipo && cumpleCuenta
  })

  // Calcular paginación
  const totalPaginas = Math.ceil(movimientosFiltrados.length / registrosPorPagina)
  const indiceInicio = (paginaActual - 1) * registrosPorPagina
  const indiceFin = indiceInicio + registrosPorPagina
  const movimientosPaginados = movimientosFiltrados.slice(indiceInicio, indiceFin)

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroTipo, filtroCuenta])

  // Calcular estadísticas globales para el resumen general
  const calcularEstadisticasGlobales = () => {
    const estadisticasPorCaja = cajas.map(caja => {
      const lotesDeEstaCaja = todosLosLotes.filter(lote => lote.fk_id_caja === caja.id)
      const detallesDeEstaCaja = todosLosDetalles.filter(detalle =>
        lotesDeEstaCaja.some(lote => lote.id_lote === detalle.fk_id_lote)
      )

      const ingresosTotales = detallesDeEstaCaja
        .filter(d => d.tipo?.toLowerCase() === 'ingreso')
        .reduce((sum, d) => sum + parseFloat(d.monto.toString()), 0)

      const egresosTotales = detallesDeEstaCaja
        .filter(d => d.tipo?.toLowerCase() === 'egreso')
        .reduce((sum, d) => sum + parseFloat(d.monto.toString()), 0)

      const saldoInicialTotal = lotesDeEstaCaja
        .reduce((sum, lote) => sum + parseFloat(lote.saldo_inicial.toString()), 0)

      const lotesAbiertos = lotesDeEstaCaja.filter(lote => lote.abierto).length
      const lotesCerrados = lotesDeEstaCaja.filter(lote => !lote.abierto).length

      return {
        caja,
        ingresosTotales,
        egresosTotales,
        saldoInicialTotal,
        saldoFinal: ingresosTotales - egresosTotales,
        totalLotes: lotesDeEstaCaja.length,
        lotesAbiertos,
        lotesCerrados,
        totalMovimientos: detallesDeEstaCaja.length
      }
    })

    const totalesGlobales = {
      ingresosTotales: estadisticasPorCaja.reduce((sum, caja) => sum + caja.ingresosTotales, 0),
      egresosTotales: estadisticasPorCaja.reduce((sum, caja) => sum + caja.egresosTotales, 0),
      saldoInicialTotal: estadisticasPorCaja.reduce((sum, caja) => sum + caja.saldoInicialTotal, 0),
      totalLotes: todosLosLotes.length,
      lotesAbiertos: todosLosLotes.filter(lote => lote.abierto).length,
      lotesCerrados: todosLosLotes.filter(lote => !lote.abierto).length,
      totalMovimientos: todosLosDetalles.length
    }

    return { estadisticasPorCaja, totalesGlobales }
  }

  const { estadisticasPorCaja, totalesGlobales } = calcularEstadisticasGlobales()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Caja</h2>
          <p className="text-muted-foreground">Control diario de caja por usuario</p>
        </div>
        {loteActivo && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Caja activa:</div>
            <div className="font-semibold">{loteActivo.caja?.nombre}</div>
            <Badge variant="default" className="mt-1">
              <Clock className="w-3 h-3 mr-1" />
              Abierta desde {loteActivo.hora_apertura}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mis-cajas">Mis Cajas</TabsTrigger>
          <TabsTrigger value="caja-actual">Caja Actual</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="resumen-general">Resumen General</TabsTrigger>
        </TabsList>

        {/* Pestaña Mis Cajas */}
        <TabsContent value="mis-cajas" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cajas.map((caja) => (
              <Card key={caja.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {caja.nombre}
                  </CardTitle>
                  <CardDescription>{caja.descripcion || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      {loteActivo?.fk_id_caja === caja.id ? (
                        <Badge variant="default" className="w-full justify-center py-2">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Caja Activa
                        </Badge>
                      ) : (
                        <Button
                          onClick={async () => {
                            const ultimoSaldo = await obtenerUltimoSaldoFinal(caja.id)
                            setAbrirCajaForm({
                              fk_id_caja: caja.id,
                              saldo_inicial: ultimoSaldo,
                              observaciones: ""
                            })
                            setIsAbrirCajaOpen(true)
                          }}
                          className="w-full bg-black hover:bg-gray-800 text-white"
                          disabled={!!loteActivo}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Abrir Caja
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pestaña Caja Actual */}
        <TabsContent value="caja-actual" className="space-y-4">
          {loteActivo ? (
            <div className="space-y-6">
              {/* Resumen por cuenta */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen por Cuenta</CardTitle>
                  <CardDescription>Ingresos, egresos y saldo por cada cuenta de tesorería</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(() => {
                      // Calcular resumen por cuenta
                      const resumenPorCuenta = new Map()

                      detallesLote.forEach(detalle => {
                        const cuentaId = detalle.fk_id_cuenta_tesoreria
                        const cuentaNombre = detalle.cuenta?.nombre || 'Cuenta desconocida'
                        const cuentaTipo = detalle.cuenta?.tipo || ''
                        const monto = parseFloat(detalle.monto?.toString() || '0')

                        if (!resumenPorCuenta.has(cuentaId)) {
                          resumenPorCuenta.set(cuentaId, {
                            nombre: cuentaNombre,
                            tipo: cuentaTipo,
                            ingresos: 0,
                            egresos: 0,
                            saldo: 0
                          })
                        }

                        const cuenta = resumenPorCuenta.get(cuentaId)
                        if (detalle.tipo === 'ingreso') {
                          cuenta.ingresos += monto
                        } else {
                          cuenta.egresos += monto
                        }
                        cuenta.saldo = cuenta.ingresos - cuenta.egresos
                      })

                      if (resumenPorCuenta.size === 0) {
                        return (
                          <div className="col-span-full text-center py-8">
                            <p className="text-muted-foreground">No hay movimientos registrados en cuentas</p>
                          </div>
                        )
                      }

                      return Array.from(resumenPorCuenta.values()).map((cuenta, index) => (
                        <Card key={index} className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">{cuenta.nombre}</CardTitle>
                            <CardDescription className="text-xs">{cuenta.tipo}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Ingresos:</span>
                              <span className="text-sm font-semibold text-green-600">
                                ${cuenta.ingresos.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Egresos:</span>
                              <span className="text-sm font-semibold text-red-600">
                                ${cuenta.egresos.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-medium">Saldo:</span>
                              <span className={`text-base font-bold ${cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${cuenta.saldo.toLocaleString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => handleImprimirMovimientos()}
                  variant="outline"
                  className="px-8"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Imprimir Movimientos
                </Button>
                <Button
                  onClick={() => setIsCerrarCajaOpen(true)}
                  className="px-8 bg-black hover:bg-gray-800 text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cerrar Caja
                </Button>
              </div>

              {/* Movimientos */}
              <Card>
                <CardHeader>
                  <CardTitle>Movimientos de la Caja Actual</CardTitle>
                  <CardDescription>Todos los movimientos de la caja actual</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filtros */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="filtro-tipo">Filtrar por tipo</Label>
                      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="ingreso">Ingresos</SelectItem>
                          <SelectItem value="egreso">Egresos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="filtro-cuenta">Filtrar por cuenta</Label>
                      <Select value={filtroCuenta} onValueChange={setFiltroCuenta}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas las cuentas</SelectItem>
                          {cuentas.map((cuenta) => (
                            <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                              {cuenta.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {movimientosFiltrados.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay movimientos que coincidan con los filtros</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Cuenta</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movimientosPaginados.map((detalle) => (
                            <TableRow key={detalle.idd}>
                              <TableCell>
                                {new Date(detalle.fecha_movimiento).toLocaleDateString('es-AR')}
                              </TableCell>
                              <TableCell>
                                {new Date(detalle.fecha_movimiento).toLocaleTimeString('es-AR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>{detalle.cuenta?.nombre || 'N/A'}</TableCell>
                              <TableCell>{detalle.concepto || 'Sin concepto'}</TableCell>
                              <TableCell>
                                {detalle.tipo?.toLowerCase() === 'ingreso' ? (
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                  >
                                    Ingreso
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: '#fecaca', color: '#991b1b' }}
                                  >
                                    Egreso
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${
                                detalle.tipo?.toLowerCase() === 'ingreso' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${detalle.monto.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Mostrando {indiceInicio + 1} a {Math.min(indiceFin, movimientosFiltrados.length)} de {movimientosFiltrados.length} movimientos
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                              disabled={paginaActual === 1}
                            >
                              Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                <Button
                                  key={num}
                                  variant={paginaActual === num ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPaginaActual(num)}
                                  className={paginaActual === num ? "bg-black hover:bg-gray-800 text-white" : ""}
                                >
                                  {num}
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                              disabled={paginaActual === totalPaginas}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay caja activa</h3>
                <p className="text-muted-foreground mb-6">
                  Para comenzar a operar, debes abrir una caja desde la pestaña "Mis Cajas"
                </p>
                <Button onClick={() => setActiveTab("mis-cajas")}>
                  Ir a Mis Cajas
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pestaña Historial */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Lotes</CardTitle>
              <CardDescription>Todas las sesiones de caja anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              {lotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay historial de cajas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caja</TableHead>
                      <TableHead>Fecha/Hora Apertura</TableHead>
                      <TableHead>Fecha/Hora Cierre</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Saldo Final</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotes.map((lote) => (
                      <TableRow key={lote.id_lote}>
                        <TableCell className="font-medium">{lote.caja?.nombre}</TableCell>
                        <TableCell>
                          <div>
                            {formatDateForDisplay(lote.fecha_apertura)}
                            {lote.hora_apertura && (
                              <div className="text-sm text-muted-foreground">{lote.hora_apertura}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lote.fecha_cierre ? (
                            <div>
                              {formatDateForDisplay(lote.fecha_cierre)}
                              {lote.hora_cierre && (
                                <div className="text-sm text-muted-foreground">{lote.hora_cierre}</div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>${lote.saldo_inicial.toLocaleString()}</TableCell>
                        <TableCell>
                          {lote.saldo_final !== null && lote.saldo_final !== undefined ? (
                            <span className={lote.saldo_final >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              ${lote.saldo_final.toLocaleString()}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lote.abierto ? "default" : "secondary"}>
                            {lote.abierto ? "Abierto" : "Cerrado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImprimirMovimientos(lote)}
                              title="Imprimir reporte"
                            >
                              <Printer className="h-4 w-4" />
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

        {/* Pestaña Resumen General */}
        <TabsContent value="resumen-general" className="space-y-4">
          <div className="space-y-6">
            {/* Estadísticas Globales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalesGlobales.totalLotes}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalesGlobales.lotesAbiertos} abiertos, {totalesGlobales.lotesCerrados} cerrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalesGlobales.totalMovimientos}</div>
                  <p className="text-xs text-muted-foreground">Todas las operaciones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Ingresos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalesGlobales.ingresosTotales.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Todas las cajas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Egresos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${totalesGlobales.egresosTotales.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Todas las cajas</p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen por Caja */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen por Caja</CardTitle>
                <CardDescription>Estado y movimientos de cada caja</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caja</TableHead>
                      <TableHead>Lotes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Movimientos</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Egresos</TableHead>
                      <TableHead className="text-right">Saldo Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estadisticasPorCaja.map((stats) => (
                      <TableRow key={stats.caja.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{stats.caja.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {stats.caja.descripcion || 'Sin descripción'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{stats.totalLotes} total</div>
                            <div className="text-xs text-muted-foreground">
                              {stats.lotesAbiertos} abiertos
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {stats.lotesAbiertos > 0 ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {stats.lotesAbiertos} Activa{stats.lotesAbiertos > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Cerrada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{stats.totalMovimientos}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${stats.saldoInicialTotal.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ${stats.ingresosTotales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          ${stats.egresosTotales.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${
                          stats.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${stats.saldoFinal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Lotes Abiertos */}
            {todosLosLotes.filter(lote => lote.abierto).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Lotes Abiertos Actualmente
                  </CardTitle>
                  <CardDescription>Cajas que están operativas en este momento</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caja</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Saldo Inicial</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todosLosLotes
                        .filter(lote => lote.abierto)
                        .map((lote) => (
                          <TableRow key={lote.id_lote}>
                            <TableCell className="font-medium">{lote.caja?.nombre}</TableCell>
                            <TableCell>{lote.usuario?.nombre}</TableCell>
                            <TableCell>
                              <div>
                                {formatDateForDisplay(lote.fecha_apertura)}
                                {lote.hora_apertura && (
                                  <div className="text-sm text-muted-foreground">{lote.hora_apertura}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${lote.saldo_inicial.toLocaleString()}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {lote.observaciones || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Abrir Caja */}
      <Dialog open={isAbrirCajaOpen} onOpenChange={setIsAbrirCajaOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>
              Inicia una nueva sesión de caja con el saldo inicial correspondiente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Caja Seleccionada</Label>
              <div className="font-medium">
                {cajas.find(c => c.id === abrirCajaForm.fk_id_caja)?.nombre || 'Ninguna'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldo_inicial">Saldo Inicial *</Label>
              {abrirCajaForm.saldo_inicial > 0 && (
                <p className="text-xs text-muted-foreground">
                  Este saldo corresponde al último cierre de caja registrado para este usuario
                </p>
              )}
              <Input
                id="saldo_inicial"
                type="number"
                step="0.01"
                min="0"
                value={abrirCajaForm.saldo_inicial}
                onChange={(e) => setAbrirCajaForm({
                  ...abrirCajaForm,
                  saldo_inicial: parseFloat(e.target.value) || 0
                })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_apertura">Observaciones</Label>
              <Textarea
                id="observaciones_apertura"
                value={abrirCajaForm.observaciones}
                onChange={(e) => setAbrirCajaForm({
                  ...abrirCajaForm,
                  observaciones: e.target.value
                })}
                placeholder="Observaciones de apertura..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuario
              </Label>
              <Input
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

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAbrirCajaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaja} disabled={loading} className="bg-black hover:bg-gray-800 text-white">
              {loading ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Agregar Movimiento */}
      <Dialog open={isMovimientoOpen} onOpenChange={setIsMovimientoOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Agregar Movimiento</DialogTitle>
            <DialogDescription>
              Registra un ingreso o egreso en la caja actual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cuenta">Cuenta *</Label>
              <Select
                value={movimientoForm.fk_id_cuenta_tesoreria.toString()}
                onValueChange={(value) => setMovimientoForm({
                  ...movimientoForm,
                  fk_id_cuenta_tesoreria: parseInt(value)
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                      {cuenta.nombre} ({cuenta.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_mov">Tipo de Movimiento *</Label>
              <Select
                value={movimientoForm.tipo}
                onValueChange={(value: 'ingreso' | 'egreso') => setMovimientoForm({
                  ...movimientoForm,
                  tipo: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_mov">Monto *</Label>
              <Input
                id="monto_mov"
                type="number"
                step="0.01"
                min="0.01"
                value={movimientoForm.monto}
                onChange={(e) => setMovimientoForm({
                  ...movimientoForm,
                  monto: parseFloat(e.target.value) || 0
                })}
                placeholder="0.00"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concepto_mov">Concepto</Label>
              <Input
                id="concepto_mov"
                value={movimientoForm.concepto}
                onChange={(e) => setMovimientoForm({
                  ...movimientoForm,
                  concepto: e.target.value
                })}
                placeholder="Descripción del movimiento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_mov">Observaciones</Label>
              <Textarea
                id="observaciones_mov"
                value={movimientoForm.observaciones}
                onChange={(e) => setMovimientoForm({
                  ...movimientoForm,
                  observaciones: e.target.value
                })}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsMovimientoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarMovimiento} disabled={loading}>
              {loading ? "Guardando..." : "Agregar Movimiento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Cerrar Caja */}
      <Dialog open={isCerrarCajaOpen} onOpenChange={setIsCerrarCajaOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>
              Finaliza la sesión actual de caja. Una vez cerrada no se podrán agregar más movimientos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen final */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Resumen Final</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Saldo Inicial:</span>
                  <div className="font-medium">${loteActivo?.saldo_inicial.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Ingresos:</span>
                  <div className="font-medium text-green-600">${ingresos.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Egresos:</span>
                  <div className="font-medium text-red-600">${egresos.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo Final:</span>
                  <div className={`font-bold text-lg ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${saldoFinal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_cierre">Observaciones de Cierre</Label>
              <Textarea
                id="observaciones_cierre"
                value={cerrarCajaForm.observaciones}
                onChange={(e) => setCerrarCajaForm({
                  ...cerrarCajaForm,
                  observaciones: e.target.value
                })}
                placeholder="Observaciones del cierre de caja..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsCerrarCajaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCerrarCaja} disabled={loading} className="bg-black hover:bg-gray-800 text-white">
              {loading ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}