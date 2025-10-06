"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Receipt, 
  DollarSign, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
  Mail,
  CreditCard as PaymentIcon,
  UserCheck,
  Calculator,
  TrendingUp,
  Package
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  Cargo, 
  MovimientoSocio, 
  Socio,
  Factura,
  getCargos,
  getMovimientosSocios,
  getSocios,
  getFacturas,
  crearCargo,
  actualizarCargo,
  eliminarCargo,
  generarFacturasAutomaticas
} from "@/lib/supabase-admin"

export function BillingModule() {
  const { toast } = useToast()
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [members, setMembers] = useState<Socio[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para gestión de cargos
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null)
  const [cargoFormData, setCargoFormData] = useState({
    nombre: '',
    tipo: 'Fijo',
    monto: '',
    descripcion: '',
    frecuencia: 'Mensual',
    activo: true
  })

  // Estados para pagos
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Socio | null>(null)

  // Estados para generación de facturas
  const [isInvoiceGenerationDialogOpen, setIsInvoiceGenerationDialogOpen] = useState(false)
  const [generatingInvoices, setGeneratingInvoices] = useState(false)
  const [selectedChargesForInvoicing, setSelectedChargesForInvoicing] = useState<{
    [cargoId: number]: {
      selected: boolean;
      includedMembers: number[];
      customAmounts?: { [socioId: number]: number };
    }
  }>({})
  const [invoiceGenerationResults, setInvoiceGenerationResults] = useState<{
    totalFacturas: number;
    totalMonto: number;
    sociosAfectados: number;
  } | null>(null)

  // Estados para filtros avanzados de movimientos
  const [filtroConcepto, setFiltroConcepto] = useState<number>(0)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroCampoFecha, setFiltroCampoFecha] = useState<"fecha" | "vencimiento">("fecha")
  const [filtroOperadorFecha, setFiltroOperadorFecha] = useState<"entre" | "mayor" | "menor">("entre")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")
  const [filtroFechaValor, setFiltroFechaValor] = useState("")

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarDatos()
  }, [])

    const cargarDatos = async () => {
    try {
      setLoading(true)
      const [cargosData, movementsData, membersData, facturasData] = await Promise.all([
        getCargos(),
        getMovimientosSocios(),
        getSocios(),
        getFacturas()
      ])
      setCargos(cargosData)
      setMovements(movementsData)
      setMembers(membersData)
      setFacturas(facturasData)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarCargos = async () => {
    try {
      const cargosData = await getCargos()
      setCargos(cargosData)
    } catch (err) {
      console.error('Error cargando cargos:', err)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cargos",
        variant: "destructive",
      })
    }
  }

  // Filtrar cargos por término de búsqueda
  const filteredCargos = cargos.filter(cargo => {
    const searchLower = searchTerm.toLowerCase()
    return (
      cargo.nombre.toLowerCase().includes(searchLower) ||
      cargo.descripcion.toLowerCase().includes(searchLower) ||
      cargo.tipo.toLowerCase().includes(searchLower) ||
      cargo.frecuencia.toLowerCase().includes(searchLower)
    )
  })

  // Manejar envío del formulario de cargo
  const handleSubmitCargo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cargoFormData.nombre || !cargoFormData.descripcion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const cargoData = {
        nombre: cargoFormData.nombre,
        tipo: cargoFormData.tipo as 'Fijo' | 'Variable',
        monto: cargoFormData.tipo === 'Fijo' ? parseFloat(cargoFormData.monto) : null,
        descripcion: cargoFormData.descripcion,
        frecuencia: cargoFormData.frecuencia as 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual',
        activo: cargoFormData.activo
      }

      if (selectedCargo) {
        // Actualizar cargo existente
        await actualizarCargo(selectedCargo.id, cargoData)
        toast({
          title: "Cargo actualizado",
          description: "El cargo ha sido actualizado exitosamente",
          variant: "default",
        })
      } else {
        // Crear nuevo cargo
        await crearCargo(cargoData)
        toast({
          title: "Cargo creado",
          description: "El cargo ha sido creado exitosamente",
          variant: "default",
        })
      }

      // Limpiar formulario y cerrar diálogo
      setCargoFormData({
        nombre: '',
        tipo: 'Fijo',
        monto: '',
        descripcion: '',
        frecuencia: 'Mensual',
        activo: true
      })
      setSelectedCargo(null)
      setIsCargoDialogOpen(false)
      setIsEditDialogOpen(false)
      
      // Recargar datos
      await cargarDatos()
      
    } catch (err) {
      console.error('Error guardando cargo:', err)
      toast({
        title: "Error",
        description: "No se pudo guardar el cargo",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para editar cargo
  const handleEditCargo = (cargo: Cargo) => {
    setSelectedCargo(cargo)
    setCargoFormData({
      nombre: cargo.nombre,
      tipo: cargo.tipo,
      monto: cargo.monto?.toString() || '',
      descripcion: cargo.descripcion,
      frecuencia: cargo.frecuencia,
      activo: cargo.activo
    })
    setIsEditDialogOpen(true)
  }

  // Abrir diálogo para eliminar cargo
  const handleDeleteCargo = (cargo: Cargo) => {
    setSelectedCargo(cargo)
    setIsDeleteDialogOpen(true)
  }

  // Confirmar eliminación de cargo
  const confirmDeleteCargo = async () => {
    if (!selectedCargo) return

    try {
      await eliminarCargo(selectedCargo.id)
      
      toast({
        title: "Cargo eliminado",
        description: "El cargo ha sido eliminado exitosamente",
        variant: "default",
      })
      
      setSelectedCargo(null)
      setIsDeleteDialogOpen(false)
      await cargarDatos()
      
    } catch (err) {
      console.error('Error eliminando cargo:', err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cargo",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para nuevo cargo
  const handleNewCargo = () => {
    setSelectedCargo(null)
    setCargoFormData({
      nombre: '',
      tipo: 'Fijo',
      monto: '',
      descripcion: '',
      frecuencia: 'Mensual',
      activo: true
    })
    setIsCargoDialogOpen(true)
  }

  // Función para registrar un pago
  const handleRegisterPayment = (paymentData: any) => {
    if (!selectedMemberForPayment) return
    
    const newPayment: MovimientoSocio = {
      id: Date.now(),
      fk_id_socio: selectedMemberForPayment.id,
      fecha: paymentData.date,
      tipo: "Pago",
      concepto: paymentData.concept,
      monto: -Math.abs(paymentData.amount), // Los pagos son negativos
      comprobante: `PAG-${String(Date.now()).slice(-6)}-${new Date().getFullYear()}`,
      saldo: calculateNewBalance(selectedMemberForPayment.id, paymentData.amount),
      estado: "Cobrada",
      metodo_pago: paymentData.paymentMethod,
      referencia: paymentData.reference,
      fecha_vencimiento: null,
      fk_id_cargo: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMovements(prev => [...prev, newPayment])
    setIsPaymentDialogOpen(false)
    setSelectedMemberForPayment(null)
  }

  // Función para calcular el nuevo saldo después de un pago
  const calculateNewBalance = (memberId: number, paymentAmount: number) => {
    const memberMovements = movements.filter(m => m.fk_id_socio === memberId)
    const currentBalance = memberMovements.length > 0 ? memberMovements[memberMovements.length - 1].saldo : 0
    return Math.max(0, currentBalance - paymentAmount)
  }

  // Función para obtener las facturas pendientes de un socio
  const getPendingInvoices = (memberId: number) => {
    return movements.filter(m => 
      m.fk_id_socio === memberId && 
      m.tipo === "Cargo" && 
      m.estado === "Pendiente"
    )
  }

  // Función para manejar la selección de cargos para facturación
  const handleChargeSelectionChange = (cargoId: number, selected: boolean) => {
    setSelectedChargesForInvoicing(prev => ({
      ...prev,
      [cargoId]: {
        ...prev[cargoId],
        selected,
        includedMembers: selected ? 
          (cargos.find(c => c.id === cargoId)?.frecuencia === 'Mensual' && cargos.find(c => c.id === cargoId)?.tipo === 'Fijo' 
            ? members.filter(m => m.status === 'Activo').map(m => m.id)
            : []
          ) : []
      }
    }))
  }

  // Función para manejar la selección de socios para un cargo variable
  const handleMemberSelectionChange = (cargoId: number, socioId: number, selected: boolean) => {
    setSelectedChargesForInvoicing(prev => ({
      ...prev,
      [cargoId]: {
        ...prev[cargoId],
        includedMembers: selected 
          ? [...(prev[cargoId]?.includedMembers || []), socioId]
          : (prev[cargoId]?.includedMembers || []).filter(id => id !== socioId)
      }
    }))
  }

  // Función para abrir el diálogo de generación de facturas
  const handleOpenInvoiceGeneration = () => {
    // Inicializar la selección con cargos mensuales fijos automáticamente seleccionados
    const initialSelection: typeof selectedChargesForInvoicing = {}
    
    cargos.filter(c => c.activo).forEach(cargo => {
      if (cargo.frecuencia === 'Mensual' && cargo.tipo === 'Fijo') {
        initialSelection[cargo.id] = {
          selected: true,
          includedMembers: members.filter(m => m.status === 'Activo').map(m => m.id)
        }
      } else {
        initialSelection[cargo.id] = {
          selected: false,
          includedMembers: []
        }
      }
    })
    
    setSelectedChargesForInvoicing(initialSelection)
    setInvoiceGenerationResults(null)
    setIsInvoiceGenerationDialogOpen(true)
  }

  // Función para generar las facturas
  const handleGenerateInvoices = async () => {
    try {
      setGeneratingInvoices(true)
      
      // Preparar los datos de cargos seleccionados
      const cargosSeleccionados = Object.entries(selectedChargesForInvoicing)
        .filter(([cargoId, data]) => data.selected && data.includedMembers.length > 0)
        .map(([cargoId, data]) => ({
          cargoId: parseInt(cargoId),
          sociosIncluidos: data.includedMembers
        }))
      
      if (cargosSeleccionados.length === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar al menos un cargo con socios incluidos",
          variant: "destructive",
        })
        return
      }
      
      // Llamar a la función de generación automática
      const resultado = await generarFacturasAutomaticas(cargosSeleccionados)
      
      // Mostrar resultados
      setInvoiceGenerationResults(resultado.resumen)
      
      // Recargar datos para reflejar las nuevas facturas y movimientos
      await cargarDatos()
      
      toast({
        title: "Facturas generadas exitosamente",
        description: `Se generaron ${resultado.resumen.totalFacturas} facturas por un total de $${resultado.resumen.totalMonto.toLocaleString()}`,
        variant: "default",
      })
      
    } catch (err) {
      console.error('Error generando facturas:', err)
      toast({
        title: "Error",
        description: "No se pudieron generar las facturas",
        variant: "destructive",
      })
    } finally {
      setGeneratingInvoices(false)
    }
  }

    return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturación a Socios</h2>
          <p className="text-muted-foreground">
            Gestiona el proceso de facturación mensual, cargos, pagos y saldos de socios
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOpenInvoiceGeneration}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Generar Cuotas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Movimientos</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Estado de Cuentas</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Movimientos de Cuenta</CardTitle>
                <CardDescription>Registro de cargos y pagos de todos los socios</CardDescription>
              </div>

              {/* Filtros Avanzados */}
              <div className="mt-4 grid gap-4 md:grid-cols-6">
                {/* Filtro por Concepto */}
                <div className="space-y-2">
                  <Label htmlFor="filtro_concepto">Concepto</Label>
                  <Select value={filtroConcepto.toString()} onValueChange={(value) => setFiltroConcepto(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los conceptos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos</SelectItem>
                      {cargos.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.id.toString()}>
                          {cargo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Estado */}
                <div className="space-y-2">
                  <Label htmlFor="filtro_estado">Estado</Label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Cobrada">Cobrada</SelectItem>
                      <SelectItem value="Vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Campo de Fecha */}
                <div className="space-y-2">
                  <Label htmlFor="filtro_campo_fecha">Campo</Label>
                  <Select value={filtroCampoFecha} onValueChange={(value: "fecha" | "vencimiento") => setFiltroCampoFecha(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fecha">Fecha</SelectItem>
                      <SelectItem value="vencimiento">Vencimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operador de Comparación */}
                <div className="space-y-2">
                  <Label htmlFor="filtro_operador">Operador</Label>
                  <Select value={filtroOperadorFecha} onValueChange={(value: "entre" | "mayor" | "menor") => setFiltroOperadorFecha(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entre">Entre</SelectItem>
                      <SelectItem value="mayor">Mayor a</SelectItem>
                      <SelectItem value="menor">Menor a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fechas según el operador */}
                {filtroOperadorFecha === "entre" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="filtro_fecha_desde">Desde</Label>
                      <Input
                        id="filtro_fecha_desde"
                        type="date"
                        value={filtroFechaDesde}
                        onChange={(e) => setFiltroFechaDesde(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filtro_fecha_hasta">Hasta</Label>
                      <Input
                        id="filtro_fecha_hasta"
                        type="date"
                        value={filtroFechaHasta}
                        onChange={(e) => setFiltroFechaHasta(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="filtro_fecha_valor">Fecha</Label>
                    <Input
                      id="filtro_fecha_valor"
                      type="date"
                      value={filtroFechaValor}
                      onChange={(e) => setFiltroFechaValor(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Botón Limpiar Filtros y Contador */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Mostrando {movements.filter((movement) => {
                    if (filtroConcepto !== 0 && movement.fk_id_cargo !== filtroConcepto) return false
                    if (filtroEstado !== "todos" && movement.estado !== filtroEstado) return false
                    const campoFechaValor = filtroCampoFecha === "fecha" ? movement.fecha : movement.fecha_vencimiento
                    if (!campoFechaValor) return true
                    if (filtroOperadorFecha === "entre") {
                      if (filtroFechaDesde && filtroFechaHasta) {
                        const fechaMovimiento = new Date(campoFechaValor)
                        const fechaDesde = new Date(filtroFechaDesde)
                        const fechaHasta = new Date(filtroFechaHasta)
                        if (fechaMovimiento < fechaDesde || fechaMovimiento > fechaHasta) return false
                      }
                    } else if (filtroOperadorFecha === "mayor") {
                      if (filtroFechaValor) {
                        const fechaMovimiento = new Date(campoFechaValor)
                        const fechaComparar = new Date(filtroFechaValor)
                        if (fechaMovimiento <= fechaComparar) return false
                      }
                    } else if (filtroOperadorFecha === "menor") {
                      if (filtroFechaValor) {
                        const fechaMovimiento = new Date(campoFechaValor)
                        const fechaComparar = new Date(filtroFechaValor)
                        if (fechaMovimiento >= fechaComparar) return false
                      }
                    }
                    return true
                  }).length} de {movements.length} movimientos
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroConcepto(0)
                    setFiltroEstado("todos")
                    setFiltroCampoFecha("fecha")
                    setFiltroOperadorFecha("entre")
                    setFiltroFechaDesde("")
                    setFiltroFechaHasta("")
                    setFiltroFechaValor("")
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Socio</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Concepto</TableHead>
                    <TableHead className="font-semibold">Monto</TableHead>
                    <TableHead className="font-semibold">Comprobante</TableHead>
                    <TableHead className="font-semibold">Saldo</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements
                    .filter((movement) => {
                      // Filtro por concepto
                      if (filtroConcepto !== 0 && movement.fk_id_cargo !== filtroConcepto) {
                        return false
                      }

                      // Filtro por estado
                      if (filtroEstado !== "todos" && movement.estado !== filtroEstado) {
                        return false
                      }

                      // Filtro por fecha
                      const campoFechaValor = filtroCampoFecha === "fecha" ? movement.fecha : movement.fecha_vencimiento
                      if (!campoFechaValor) return true

                      if (filtroOperadorFecha === "entre") {
                        if (filtroFechaDesde && filtroFechaHasta) {
                          const fechaMovimiento = new Date(campoFechaValor)
                          const fechaDesde = new Date(filtroFechaDesde)
                          const fechaHasta = new Date(filtroFechaHasta)
                          if (fechaMovimiento < fechaDesde || fechaMovimiento > fechaHasta) {
                            return false
                          }
                        }
                      } else if (filtroOperadorFecha === "mayor") {
                        if (filtroFechaValor) {
                          const fechaMovimiento = new Date(campoFechaValor)
                          const fechaComparar = new Date(filtroFechaValor)
                          if (fechaMovimiento <= fechaComparar) {
                            return false
                          }
                        }
                      } else if (filtroOperadorFecha === "menor") {
                        if (filtroFechaValor) {
                          const fechaMovimiento = new Date(campoFechaValor)
                          const fechaComparar = new Date(filtroFechaValor)
                          if (fechaMovimiento >= fechaComparar) {
                            return false
                          }
                        }
                      }

                      return true
                    })
                    .map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{movement.fecha}</TableCell>
                      <TableCell className="font-medium">
                        {members.find(m => m.id === movement.fk_id_socio)?.razon_social || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.tipo === "Cargo" ? "destructive" : "default"} className={movement.tipo === "Cargo" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                          {movement.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.concepto}</TableCell>
                      <TableCell className={movement.monto > 0 ? "text-red-600" : "text-green-600"}>
                        ${Math.abs(movement.monto).toLocaleString()}
                      </TableCell>
                      <TableCell>{movement.comprobante}</TableCell>
                      <TableCell className="font-medium">
                        ${movement.saldo.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            movement.estado === "Cobrada" ? "default" : 
                            movement.estado === "Pendiente" ? "secondary" : "destructive"
                          }
                          className={
                            movement.estado === "Cobrada" ? "bg-green-100 text-green-800" :
                            movement.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {movement.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                            <Download className="h-4 w-4" />
                          </Button>
                          {movement.estado === "Pendiente" && (
                            <>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => {
                                  const member = members.find(m => m.id === movement.fk_id_socio)
                                  if (member) {
                                    setSelectedMemberForPayment(member)
                                    setIsPaymentDialogOpen(true)
                                  }
                                }}
                              >
                                <PaymentIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cuentas por Socio</CardTitle>
              <CardDescription>Saldo actual y estado de cada socio</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Socio</TableHead>
                    <TableHead className="font-semibold">CUIT</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Saldo Actual</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const memberMovements = movements.filter(m => m.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    const currentBalance = memberMovements.length > 0 ? memberMovements[0].saldo : 0
                    const pendingInvoices = facturas.filter(f => f.fk_id_socio === member.id && f.estado === "Pendiente")
                    const lastPayment = movements.filter(m => m.fk_id_socio === member.id && m.tipo === "Pago").sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                    const lastInvoice = facturas.filter(f => f.fk_id_socio === member.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.razon_social}</TableCell>
                        <TableCell>{member.cuit}</TableCell>
                        <TableCell>{member.mail}</TableCell>
                        <TableCell className={currentBalance > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                          ${Math.abs(currentBalance).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge 
                              variant={currentBalance === 0 ? "default" : currentBalance > 0 ? "destructive" : "secondary"}
                              className={
                                currentBalance === 0 ? "bg-green-100 text-green-800" :
                                currentBalance > 0 ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                              }
                            >
                              {currentBalance === 0 ? "Al día" : currentBalance > 0 ? "Deudor" : "A favor"}
                            </Badge>
                            {lastPayment && (
                              <div className="text-xs text-muted-foreground">
                                Último pago: {new Date(lastPayment.fecha).toLocaleDateString()}
                              </div>
                            )}
                            {lastInvoice && (
                              <div className="text-xs text-muted-foreground">
                                Última factura: {new Date(lastInvoice.fecha).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Ver detalle">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Estado de cuenta">
                              <FileText className="h-4 w-4" />
                            </Button>
                            {pendingInvoices.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-600 hover:text-gray-800"
                                title={`${pendingInvoices.length} facturas pendientes`}
                                onClick={() => {
                                  setSelectedMemberForPayment(member)
                                  setIsPaymentDialogOpen(true)
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Enviar por email">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${facturas.reduce((sum, f) => sum + f.total, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de facturas emitidas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Recibidos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Math.abs(movements.filter(m => m.tipo === "Pago").reduce((sum, m) => sum + m.monto, 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de pagos registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Facturas Vencidas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {facturas.filter(f => f.estado === "Vencida" || (f.estado === "Pendiente" && new Date(f.fecha_vencimiento) < new Date())).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Facturas vencidas o por vencer
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Cobranza</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {facturas.length > 0 ? 
                    Math.round((facturas.filter(f => f.estado === "Pagada").length / facturas.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Porcentaje de facturas pagadas
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen por Tipo de Cargo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cargos.filter(c => c.activo).map((cargo) => {
                    const movimientosCargo = movements.filter(m => m.fk_id_cargo === cargo.id)
                    const totalCargo = movimientosCargo.reduce((sum, m) => sum + m.monto, 0)
                    
                    return (
                      <div key={cargo.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{cargo.nombre}</p>
                          <p className="text-sm text-muted-foreground">{cargo.frecuencia}</p>
                        </div>
                        <div className="font-medium">${totalCargo.toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Enero 2024</p>
                      <p className="text-sm text-muted-foreground">Pagos del mes</p>
                    </div>
                    <div className="font-medium">$45,231</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Febrero 2024</p>
                      <p className="text-sm text-muted-foreground">Pagos del mes</p>
                    </div>
                    <div className="font-medium">$52,340</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Marzo 2024</p>
                      <p className="text-sm text-muted-foreground">Pagos del mes</p>
                    </div>
                    <div className="font-medium">$48,120</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para crear/editar cargo */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg rounded-lg">
           <DialogHeader>
            <DialogTitle>Crear Nuevo Cargo</DialogTitle>
            <DialogDescription>Define un nuevo tipo de cargo para aplicar a los socios</DialogDescription>
           </DialogHeader>
          <form onSubmit={handleSubmitCargo} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del Cargo *</Label>
            <Input
                  id="nombre"
                  value={cargoFormData.nombre}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Cuota Social Mensual"
              required
            />
          </div>
          <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={cargoFormData.tipo}
                  onValueChange={(value) => setCargoFormData(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {cargoFormData.tipo === 'Fijo' && (
              <div className="grid gap-2">
                <Label htmlFor="monto">Monto *</Label>
            <Input
                  id="monto"
              type="number"
              step="0.01"
                  min="0"
                  value={cargoFormData.monto}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select
                value={cargoFormData.frecuencia}
                onValueChange={(value) => setCargoFormData(prev => ({ ...prev, frecuencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
        </div>

        <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={cargoFormData.descripcion}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe el cargo y su propósito..."
                rows={3}
            required
          />
        </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={cargoFormData.activo}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, activo: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="activo">Cargo activo</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCargoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Crear Cargo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar cargo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
            <DialogDescription>Modifica la información del cargo seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCargo} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
                <Label htmlFor="edit-nombre">Nombre del Cargo *</Label>
                <Input
                  id="edit-nombre"
                  value={cargoFormData.nombre}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Cuota Social Mensual"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
            <Select
                  value={cargoFormData.tipo}
                  onValueChange={(value) => setCargoFormData(prev => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
              </SelectContent>
            </Select>
          </div>
            </div>
            
            {cargoFormData.tipo === 'Fijo' && (
          <div className="grid gap-2">
                <Label htmlFor="edit-monto">Monto *</Label>
            <Input
                  id="edit-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cargoFormData.monto}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  required
            />
          </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="edit-frecuencia">Frecuencia *</Label>
              <Select
                value={cargoFormData.frecuencia}
                onValueChange={(value) => setCargoFormData(prev => ({ ...prev, frecuencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <Textarea
                id="edit-descripcion"
                value={cargoFormData.descripcion}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe el cargo y su propósito..."
                rows={3}
                required
              />
        </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-activo"
                checked={cargoFormData.activo}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, activo: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-activo">Cargo activo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
          Cancelar
        </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Actualizar Cargo
        </Button>
      </div>
    </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para generación de facturas */}
      <Dialog open={isInvoiceGenerationDialogOpen} onOpenChange={setIsInvoiceGenerationDialogOpen}>
        <DialogContent className="max-w-4xl bg-white border border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Generar Facturas Automáticamente</DialogTitle>
            <DialogDescription>
              Selecciona los cargos para generar facturas. Los cargos mensuales fijos se aplicarán automáticamente a todos los socios activos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {cargos.filter(c => c.activo).map((cargo) => {
              const isSelected = selectedChargesForInvoicing[cargo.id]?.selected || false
              const includedMembers = selectedChargesForInvoicing[cargo.id]?.includedMembers || []
              const isAutomatic = cargo.frecuencia === 'Mensual' && cargo.tipo === 'Fijo'
              
              return (
                <Card key={cargo.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleChargeSelectionChange(cargo.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <CardTitle className="text-lg">{cargo.nombre}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={cargo.tipo === 'Fijo' ? 'default' : 'secondary'} className="text-xs">
                              {cargo.tipo}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {cargo.frecuencia}
                            </Badge>
                            {cargo.tipo === 'Fijo' && cargo.monto && (
                              <Badge variant="secondary" className="text-xs">
                                ${cargo.monto.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isAutomatic && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Automático
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{cargo.descripcion}</p>
                  </CardHeader>
                  
                  {isSelected && !isAutomatic && (
                    <CardContent className="pt-0">
                      <div>
                        <Label className="text-sm font-medium">Seleccionar socios para este cargo variable:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                          {members.filter(m => m.status === 'Activo').map((member) => (
                            <div key={member.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={includedMembers.includes(member.id)}
                                onChange={(e) => handleMemberSelectionChange(cargo.id, member.id, e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm truncate" title={member.razon_social}>
                                {member.razon_social}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                  
                  {isSelected && isAutomatic && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        ✓ Se aplicará automáticamente a todos los socios activos ({members.filter(m => m.status === 'Activo').length} socios)
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
          
          {invoiceGenerationResults && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">¡Facturas generadas exitosamente!</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-700">Facturas creadas</div>
                      <div className="text-2xl font-bold text-green-800">{invoiceGenerationResults.totalFacturas}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-700">Monto total</div>
                      <div className="text-2xl font-bold text-green-800">${invoiceGenerationResults.totalMonto.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-700">Socios afectados</div>
                      <div className="text-2xl font-bold text-green-800">{invoiceGenerationResults.sociosAfectados}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsInvoiceGenerationDialogOpen(false)}
            >
              {invoiceGenerationResults ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!invoiceGenerationResults && (
              <Button 
                onClick={handleGenerateInvoices}
                disabled={generatingInvoices || Object.values(selectedChargesForInvoicing).every(charge => !charge.selected)}
                className="bg-black text-white hover:bg-gray-800"
              >
                {generatingInvoices ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Generar Facturas
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el cargo "{selectedCargo?.nombre}"? 
              Esta acción no se puede deshacer y podría afectar los movimientos existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCargo}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
 }
