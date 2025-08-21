"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, FileText, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Receipt, CreditCard } from "lucide-react"
import { 
  Socio, 
  Factura, 
  Pago,
  MovimientoSocio,
  getSocios,
  getFacturas,
  getPagos,
  getMovimientosSocios,
  crearPago
} from "@/lib/supabase-admin"
import { useToast } from "@/hooks/use-toast"

export function AccountingModule() {
  const [accounts, setAccounts] = useState<Socio[]>([])
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [payments, setPayments] = useState<Pago[]>([])
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para el popup de registro de pago
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    fk_id_socio: '',
    fk_id_factura: '',
    monto: '',
    metodo: 'Efectivo',
    fecha: new Date().toISOString().split('T')[0],
    referencia: ''
  })
  const [savingPayment, setSavingPayment] = useState(false)
  const { toast } = useToast()

  // Obtener facturas pendientes del socio seleccionado
  const facturasSocioSeleccionado = paymentForm.fk_id_socio ? 
    invoices.filter(f => f.fk_id_socio === parseInt(paymentForm.fk_id_socio) && f.estado === 'Pendiente') : []

  // Manejar cambios en el formulario de pago
  const handlePaymentFormChange = (field: string, value: string) => {
    setPaymentForm(prev => {
      const updated = { ...prev, [field]: value }
      
      // Si cambia el socio, resetear la factura seleccionada
      if (field === 'fk_id_socio') {
        updated.fk_id_factura = ''
        updated.monto = ''
      }
      
      // Si selecciona una factura, autocompletar el monto
      if (field === 'fk_id_factura' && value) {
        const factura = invoices.find(f => f.id === value)
        if (factura) {
          updated.monto = factura.total.toString()
        }
      }
      
      return updated
    })
  }

  // Registrar pago
  const handleSubmitPayment = async () => {
    if (!paymentForm.fk_id_socio || !paymentForm.monto || !paymentForm.fecha) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      })
      return
    }

    try {
      setSavingPayment(true)
      
      // Generar ID único para el pago
      const timestamp = Date.now().toString().slice(-8)
      const randomSuffix = Math.random().toString(36).substr(2, 4)
      const pagoId = `PAG-${timestamp}-${randomSuffix}`

      const pagoData = {
        id: pagoId,
        fk_id_socio: parseInt(paymentForm.fk_id_socio),
        fecha: paymentForm.fecha,
        monto: parseFloat(paymentForm.monto),
        metodo: paymentForm.metodo,
        fk_id_factura: paymentForm.fk_id_factura || null,
        referencia: paymentForm.referencia || null
      }

      await crearPago(pagoData)
      
      // Recargar datos
      const [accountsData, invoicesData, paymentsData, movementsData] = await Promise.all([
        getSocios(),
        getFacturas(),
        getPagos(),
        getMovimientosSocios()
      ])
      setAccounts(accountsData)
      setInvoices(invoicesData)
      setPayments(paymentsData)
      setMovements(movementsData)

      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente"
      })

      // Resetear formulario y cerrar diálogo
      setPaymentForm({
        fk_id_socio: '',
        fk_id_factura: '',
        monto: '',
        metodo: 'Efectivo',
        fecha: new Date().toISOString().split('T')[0],
        referencia: ''
      })
      setIsPaymentDialogOpen(false)

    } catch (error) {
      console.error('Error registrando pago:', error)
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive"
      })
    } finally {
      setSavingPayment(false)
    }
  }

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [accountsData, invoicesData, paymentsData, movementsData] = await Promise.all([
          getSocios(),
          getFacturas(),
          getPagos(),
          getMovimientosSocios()
        ])
        setAccounts(accountsData)
        setInvoices(invoicesData)
        setPayments(paymentsData)
        setMovements(movementsData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Calcular totales basados en movimientos reales
  const calcularEstadisticas = () => {
    let totalDeudor = 0
    let totalAFavor = 0
    let cuentasVencidas = 0
    
    accounts.forEach(socio => {
      const movimientosSocio = movements.filter(m => m.fk_id_socio === socio.id)
      const saldoActual = movimientosSocio.length > 0 ? 
        movimientosSocio.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]?.saldo || 0 : 0
      
      if (saldoActual > 0) {
        totalDeudor += saldoActual
        
        // Verificar si tiene facturas vencidas
        const facturasVencidas = invoices.filter(f => 
          f.fk_id_socio === socio.id && 
          f.estado === 'Pendiente' && 
          new Date(f.fecha_vencimiento) < new Date()
        )
        if (facturasVencidas.length > 0) {
          cuentasVencidas++
        }
      } else if (saldoActual < 0) {
        totalAFavor += Math.abs(saldoActual)
      }
    })
    
    return { totalDeudor, totalAFavor, cuentasVencidas }
  }
  
  const { totalDeudor, totalAFavor, cuentasVencidas } = calcularEstadisticas()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cuentas Corrientes</h2>
          <p className="text-muted-foreground">
            Gestión financiera y facturación de socios
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white">
                <CreditCard className="mr-2 h-4 w-4" />
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-xl text-black">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Registrar Pago</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Registra un pago realizado por un socio para una factura específica
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Selección de Socio */}
                <div className="grid gap-2">
                  <Label htmlFor="socio" className="text-sm font-medium">
                    Socio <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={paymentForm.fk_id_socio} 
                    onValueChange={(value) => handlePaymentFormChange('fk_id_socio', value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar socio..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {accounts.map((socio) => (
                        <SelectItem key={socio.id} value={socio.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{socio.razon_social}</span>
                            <span className="text-sm text-muted-foreground">{socio.cuit}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selección de Factura */}
                <div className="grid gap-2">
                  <Label htmlFor="factura" className="text-sm font-medium">
                    Factura (Opcional)
                  </Label>
                  <Select 
                    value={paymentForm.fk_id_factura} 
                    onValueChange={(value) => handlePaymentFormChange('fk_id_factura', value)}
                    disabled={!paymentForm.fk_id_socio}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={
                        !paymentForm.fk_id_socio 
                          ? "Primero selecciona un socio..." 
                          : facturasSocioSeleccionado.length === 0
                          ? "No hay facturas pendientes"
                          : "Seleccionar factura..."
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {facturasSocioSeleccionado.map((factura) => (
                        <SelectItem key={factura.id} value={factura.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{factura.id}</span>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{new Date(factura.fecha).toLocaleDateString()}</span>
                              <span className="font-medium">${factura.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentForm.fk_id_socio && facturasSocioSeleccionado.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Este socio no tiene facturas pendientes. Puedes registrar un pago a cuenta.
                    </p>
                  )}
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="monto" className="text-sm font-medium">
                      Monto <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="monto"
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paymentForm.monto}
                      onChange={(e) => handlePaymentFormChange('monto', e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha" className="text-sm font-medium">
                      Fecha <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="fecha"
                      type="date"
                      value={paymentForm.fecha}
                      onChange={(e) => handlePaymentFormChange('fecha', e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="grid gap-2">
                  <Label htmlFor="metodo" className="text-sm font-medium">
                    Método de Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={paymentForm.metodo} 
                    onValueChange={(value) => handlePaymentFormChange('metodo', value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Efectivo">💵 Efectivo</SelectItem>
                      <SelectItem value="Transferencia">🏦 Transferencia</SelectItem>
                      <SelectItem value="Cheque">📋 Cheque</SelectItem>
                      <SelectItem value="Tarjeta">💳 Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Referencia */}
                <div className="grid gap-2">
                  <Label htmlFor="referencia" className="text-sm font-medium">
                    Referencia (Opcional)
                  </Label>
                  <Textarea 
                    id="referencia"
                    placeholder="Número de comprobante, observaciones, etc."
                    value={paymentForm.referencia}
                    onChange={(e) => handlePaymentFormChange('referencia', e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  disabled={savingPayment}
                  className="h-11 px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitPayment}
                  disabled={savingPayment || !paymentForm.fk_id_socio || !paymentForm.monto || !paymentForm.fecha}
                  className="bg-black hover:bg-gray-800 text-white h-11 px-6"
                >
                  {savingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Registrar Pago
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Cobrar</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDeudor.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Saldos deudores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldos a Favor</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalAFavor.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Créditos de socios</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{cuentasVencidas}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${(totalDeudor - totalAFavor).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Diferencia total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="accounts" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Cuentas Corrientes</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Facturas</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Pagos</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cuentas Corrientes</CardTitle>
              <CardDescription>Saldos actuales de todos los socios</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando cuentas corrientes...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay socios</h3>
                  <p className="text-muted-foreground">Aún no se han registrado socios en el sistema.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Socio</TableHead>
                      <TableHead className="font-semibold">CUIT</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Saldo</TableHead>
                      <TableHead className="font-semibold">Último Pago</TableHead>
                      <TableHead className="font-semibold">Última Factura</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      // Calcular saldo actual desde movimientos de socios
                      const movimientosSocio = movements.filter(m => m.fk_id_socio === account.id)
                      const saldoActual = movimientosSocio.length > 0 ? 
                        movimientosSocio.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]?.saldo || 0 : 0
                      
                      // Encontrar último pago desde movimientos
                      const ultimoPago = movements
                        .filter(m => m.fk_id_socio === account.id && m.tipo === 'Pago')
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                      
                      // Encontrar última factura
                      const ultimaFactura = invoices
                        .filter(f => f.fk_id_socio === account.id)
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
                      
                      // Determinar estado basado en saldo
                      const estado = saldoActual > 0 ? 'Deudor' : saldoActual < 0 ? 'A favor' : 'Al día'
                      
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.razon_social}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{account.cuit}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{account.email}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              saldoActual > 0 ? 'text-red-600' : 
                              saldoActual < 0 ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              ${Math.abs(saldoActual).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {ultimoPago ? 
                              new Date(ultimoPago.fecha).toLocaleDateString() : 
                              <span className="text-muted-foreground">Sin pagos</span>
                            }
                          </TableCell>
                          <TableCell>
                            {ultimaFactura ? 
                              new Date(ultimaFactura.fecha).toLocaleDateString() : 
                              <span className="text-muted-foreground">Sin facturas</span>
                            }
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                estado === "Al día" ? "default" : 
                                estado === "Deudor" ? "destructive" : "secondary"
                              }
                              className={
                                estado === "Al día" ? "bg-green-100 text-green-800" :
                                estado === "Deudor" ? "bg-red-100 text-red-800" :
                                "bg-blue-100 text-blue-800"
                              }
                            >
                              {estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Ver estado de cuenta">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Registrar pago">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturas Emitidas</CardTitle>
              <CardDescription>Historial de facturas generadas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
                  <p className="text-muted-foreground">Aún no se han generado facturas en el sistema.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Número</TableHead>
                      <TableHead className="font-semibold">Socio</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Monto</TableHead>
                      <TableHead className="font-semibold">Vencimiento</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{(invoice as any).socios?.razon_social || 'N/A'}</TableCell>
                        <TableCell>{new Date(invoice.fecha).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">${invoice.total.toLocaleString()}</TableCell>
                        <TableCell>{new Date(invoice.fecha_vencimiento).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              invoice.estado === "Pagada" ? "default" : 
                              invoice.estado === "Pendiente" ? "secondary" : "destructive"
                            }
                            className={
                              invoice.estado === "Pagada" ? "bg-green-100 text-green-800" :
                              invoice.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                              invoice.estado === "Vencida" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {invoice.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Ver factura">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Imprimir">
                              <Receipt className="h-4 w-4" />
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

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos Registrados</CardTitle>
              <CardDescription>Historial de pagos recibidos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">ID Pago</TableHead>
                    <TableHead className="font-semibold">Socio</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Monto</TableHead>
                    <TableHead className="font-semibold">Método</TableHead>
                    <TableHead className="font-semibold">Factura</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell className="font-medium">$0</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">Efectivo</Badge>
                      </TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Saldos</CardTitle>
                <CardDescription>Estado general de las cuentas corrientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Socios con saldo deudor:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Socios con saldo acreedor:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuentas al día:</span>
                    <span className="font-medium">{accounts.filter((a) => a.status === "A Favor").length}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total a cobrar:</span>
                    <span className="font-bold text-red-600">${totalDeudor.toLocaleString()}</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-black hover:bg-gray-800 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Reporte PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saldos Pendientes</CardTitle>
                <CardDescription>Socios con deudas pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accounts
                    .filter((a) => a.status === "Activo")
                    .map((account) => (
                      <div key={account.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{account.razon_social}</p>
                          <p className="text-sm text-muted-foreground">Último pago: N/A</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">$0</p>
                          <Badge
                            variant={account.status === "Vencido" ? "destructive" : "secondary"}
                            className={`text-xs ${account.status === "Vencido" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
                <Button className="w-full mt-4 bg-black hover:bg-gray-800 text-white">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Enviar Recordatorios
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
