"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, FileText, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Receipt, CreditCard, Search, ChevronLeft, ChevronRight, User } from "lucide-react"
import {
  Socio,
  Factura,
  Pago,
  MovimientoSocio,
  CuentaTesoreria,
  getSocios,
  getFacturas,
  getPagos,
  getMovimientosSocios,
  getCuentasTesoreria,
  crearPago
} from "@/lib/supabase-admin"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"

export function AccountingModule() {
  const { toast } = useToast()

  const [accounts, setAccounts] = useState<Socio[]>([])
  const [invoices, setInvoices] = useState<Factura[]>([])
  const [payments, setPayments] = useState<Pago[]>([])
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [cuentasTesoreria, setCuentasTesoreria] = useState<CuentaTesoreria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para selección de socio
  const [selectedSocioId, setSelectedSocioId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Obtener datos del socio seleccionado
  const selectedSocio = selectedSocioId ? accounts.find(a => a.id === selectedSocioId) : null
  const selectedSocioMovements = selectedSocioId ? movements.filter(m => m.fk_id_socio === selectedSocioId) : []
  const selectedSocioInvoices = selectedSocioId ? invoices.filter(f => f.fk_id_socio === selectedSocioId) : []
  const selectedSocioPayments = selectedSocioId ? payments.filter(p => p.fk_id_socio === selectedSocioId) : []

  // Calcular saldo actual del socio seleccionado - suma de saldos de cuotas pendientes y vencidas
  const pendingAndOverdueMovements = selectedSocioMovements.filter(m => m.estado === 'Pendiente' || m.estado === 'Vencida')
  const currentBalance = pendingAndOverdueMovements.reduce((sum, m) => sum + (m.saldo || 0), 0)

  // Filtrar socios para el selector
  const filteredAccounts = accounts.filter(account =>
    account.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.cuit.includes(searchTerm)
  )

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [accountsData, invoicesData, paymentsData, movementsData, cuentasTesoreriaData] = await Promise.all([
          getSocios(),
          getFacturas(),
          getPagos(),
          getMovimientosSocios(),
          getCuentasTesoreria()
        ])
        setAccounts(accountsData)
        setInvoices(invoicesData)
        setPayments(paymentsData)
        setMovements(movementsData)
        setCuentasTesoreria(cuentasTesoreriaData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Intentar de nuevo</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cuentas corrientes</h2>
          <p className="text-muted-foreground">
            Gestión financiera y facturación de socios
          </p>
        </div>
      </div>

      {/* Selector de Socio */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Socio</CardTitle>
          <CardDescription>Elige un socio para ver su cuenta corriente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="socio-search">Buscar y Seleccionar Socio</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="socio-search"
                  placeholder="Buscar por razón social o CUIT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {searchTerm && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No se encontraron socios con "{searchTerm}"
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredAccounts.slice(0, 10).map((socio) => (
                      <div
                        key={socio.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedSocioId(socio.id)
                          setSearchTerm("")
                        }}
                      >
                        <div>
                          <div className="font-medium">{socio.razon_social}</div>
                          <div className="text-sm text-muted-foreground">{socio.cuit}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {socio.tipo_socio}
                        </div>
                      </div>
                    ))}
                    {filteredAccounts.length > 10 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        ... y {filteredAccounts.length - 10} socios más. Refina tu búsqueda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Socio seleccionado */}
            {selectedSocio && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">{selectedSocio.razon_social}</div>
                    <div className="text-sm text-blue-700">CUIT: {selectedSocio.cuit}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSocioId(null)
                      setSearchTerm("")
                    }}
                  >
                    Cambiar Socio
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSocio ? (
        <>
          {/* Información del socio seleccionado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedSocio.razon_social}
              </CardTitle>
              <CardDescription>
                CUIT: {selectedSocio.cuit} | Email: {selectedSocio.mail || 'No registrado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Saldo Actual</div>
                  <div className={`text-2xl font-bold ${
                    currentBalance > 0 ? 'text-red-600' :
                    currentBalance < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    ${Math.abs(currentBalance).toLocaleString()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded mt-1 ${
                    currentBalance === 0 ? "bg-green-100 text-green-700" :
                    currentBalance > 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {currentBalance === 0 ? "Al día" : currentBalance > 0 ? "Deudor" : "A favor"}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Movimientos</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedSocioMovements.length}
                  </div>
                  <div className="text-xs text-gray-500">Registros</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Facturas</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedSocioInvoices.length}
                  </div>
                  <div className="text-xs text-gray-500">Emitidas</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Pagos</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedSocioPayments.length}
                  </div>
                  <div className="text-xs text-gray-500">Realizados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="movements" className="space-y-4">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Cuotas cobradas</TabsTrigger>
              <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Facturas</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Pagos</TabsTrigger>
            </TabsList>

            <TabsContent value="movements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cuotas cobradas de {selectedSocio.razon_social}</CardTitle>
                  <CardDescription>Historial de cuotas cobradas del socio seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSocioMovements.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay cuotas cobradas</h3>
                      <p className="text-muted-foreground">Este socio no tiene cuotas cobradas registradas.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Concepto</TableHead>
                          <TableHead className="font-semibold">Monto</TableHead>
                          <TableHead className="font-semibold">Saldo</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSocioMovements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDateForDisplay(movement.fecha)}</TableCell>
                            <TableCell>
                              <Badge variant={movement.tipo === "Cargo" ? "destructive" : "default"} className={movement.tipo === "Cargo" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                {movement.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>{movement.concepto}</TableCell>
                            <TableCell className={movement.monto > 0 ? "text-red-600" : "text-green-600"}>
                              ${Math.abs(movement.monto).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${movement.saldo.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  movement.estado === "Cobrada" ? "default" :
                                  movement.estado === "Pendiente" ? "secondary" :
                                  movement.estado === "Vencida" ? "destructive" : "outline"
                                }
                                className={
                                  movement.estado === "Cobrada" ? "bg-green-100 text-green-800" :
                                  movement.estado === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                                  movement.estado === "Vencida" ? "bg-red-100 text-red-800" :
                                  "bg-gray-100 text-gray-800"
                                }
                              >
                                {movement.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Facturas de {selectedSocio.razon_social}</CardTitle>
                  <CardDescription>Facturas emitidas para el socio seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSocioInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
                      <p className="text-muted-foreground">Este socio no tiene facturas emitidas.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold">Monto</TableHead>
                          <TableHead className="font-semibold">Vencimiento</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSocioInvoices.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id || invoice.id}</TableCell>
                            <TableCell>{formatDateForDisplay(invoice.fecha)}</TableCell>
                            <TableCell className="font-medium">${invoice.total.toLocaleString()}</TableCell>
                            <TableCell>{formatDateForDisplay(invoice.fecha_vencimiento)}</TableCell>
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
                  <CardTitle>Pagos de {selectedSocio.razon_social}</CardTitle>
                  <CardDescription>Pagos realizados por el socio seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSocioPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay pagos registrados</h3>
                      <p className="text-muted-foreground">Este socio no tiene pagos registrados.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">ID Pago</TableHead>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold">Monto</TableHead>
                          <TableHead className="font-semibold">Método de Pago</TableHead>
                          <TableHead className="font-semibold">Cuota Pagada</TableHead>
                          <TableHead className="font-semibold">Referencia</TableHead>
                          <TableHead className="font-semibold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSocioPayments.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((payment) => {
                          const movimiento = payment.fk_id_movimiento ?
                            movements.find(m => m.id === payment.fk_id_movimiento) : null

                          return (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.id}</TableCell>
                              <TableCell>{formatDateForDisplay(payment.fecha)}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                ${payment.monto.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {payment.fk_id_cuenta_tesoreria ? (
                                  (() => {
                                    const cuenta = cuentasTesoreria.find(c => c.id === payment.fk_id_cuenta_tesoreria);
                                    return cuenta ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{cuenta.nombre}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {cuenta.tipo}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">Método no encontrado</span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-muted-foreground text-sm">No especificado</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {movimiento ? (
                                  <div>
                                    <div className="font-medium text-sm">{movimiento.concepto}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Cuota: {movimiento.comprobante}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                    Pago a cuenta
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {payment.referencia ? (
                                  <span className="text-sm">{payment.referencia}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Sin referencia</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800" title="Ver recibo">
                                  <Receipt className="h-4 w-4" />
                                </Button>
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
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Selecciona un socio</h3>
            <p className="text-muted-foreground mb-4">
              Para ver la cuenta corriente, primero debes seleccionar un socio de la lista.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}