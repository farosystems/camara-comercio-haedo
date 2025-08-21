"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Eye, Package, ShoppingCart, TrendingUp, Minus, Search } from "lucide-react"
import { 
  Socio, 
  Proveedor, 
  Producto, 
  ListaPrecio,
  Pedido,
  CondicionCompra,
  getSocios,
  getProveedores,
  getProductos,
  getListasPrecios,
  getPedidos,
  getCondicionesCompra
} from "@/lib/supabase-admin"

// Tipos para el formulario de pedidos
interface SelectedProduct {
  productId: number
  product: Producto
  price: number
  discount: number
  quantity: number
}

interface PriceListItem {
  productId: number
  price: number
  discount: number
}

export function OrdersModule() {
  const [members, setMembers] = useState<Socio[]>([])
  const [providers, setProviders] = useState<Proveedor[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [priceLists, setPriceLists] = useState<ListaPrecio[]>([])
  const [orders, setOrders] = useState<Pedido[]>([])
  const [condicionesCompra, setCondicionesCompra] = useState<CondicionCompra[]>([])
  const [itemsCount, setItemsCount] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [membersData, providersData, productsData, priceListsData, ordersData, condicionesData] = await Promise.all([
          getSocios(),
          getProveedores(),
          getProductos(),
          getListasPrecios(),
          getPedidos(),
          getCondicionesCompra()
        ])
        setMembers(membersData)
        setProviders(providersData)
        setProducts(productsData)
        setPriceLists(priceListsData)
        setOrders(ordersData)
        setCondicionesCompra(condicionesData)
        
        // Cargar cantidad de items por pedido
        await cargarItemsCount(ordersData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Función para cargar la cantidad de items por pedido
  const cargarItemsCount = async (pedidos: Pedido[]) => {
    try {
      if (pedidos.length === 0) return
      
      const pedidoIds = pedidos.map(p => p.id)
      const response = await fetch('/api/pedidos/items-count-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoIds })
      })
      
      if (response.ok) {
        const data = await response.json()
        setItemsCount(data.itemsCount || {})
      } else {
        console.error('Error obteniendo conteo de items')
      }
    } catch (error) {
      console.error('Error cargando cantidad de items:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">Administra pedidos, seguimiento y entregas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Pedido</DialogTitle>
              <DialogDescription>Selecciona una lista de precios y los productos que deseas</DialogDescription>
            </DialogHeader>
            <OrderForm members={members} providers={providers} products={products} priceLists={priceLists} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="tracking">Seguimiento</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Realizados</CardTitle>
              <CardDescription>Historial completo de todos los pedidos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay pedidos</h3>
                  <p className="text-muted-foreground">Aún no se han realizado pedidos en el sistema.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Socio</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Condición de Compra</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const condicionCompra = condicionesCompra.find(c => c.id === (order as any).fk_id_condicion_compra)
                      const cantidadItems = itemsCount[order.id] || 0
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            {members.find(m => m.id === order.fk_id_socio)?.razon_social || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {providers.find(p => p.id === order.fk_id_proveedor)?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>{new Date(order.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{cantidadItems}</span>
                              <span className="text-sm text-muted-foreground">
                                {cantidadItems === 1 ? 'artículo' : 'artículos'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${order.total.toLocaleString()}</TableCell>
                          <TableCell>
                            {condicionCompra ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {condicionCompra.nombre}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Sin condición</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.estado === "Entregado"
                                  ? "default"
                                  : order.estado === "Procesado"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                order.estado === "Entregado"
                                  ? "bg-green-100 text-green-800"
                                  : order.estado === "Procesado"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.estado === "Pendiente"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                              }
                            >
                              {order.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" title="Ver detalles">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Editar pedido">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Ver productos">
                                <Package className="h-4 w-4" />
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

        <TabsContent value="tracking" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">1</div>
                <p className="text-sm text-muted-foreground">Pedidos por procesar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">En Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">1</div>
                <p className="text-sm text-muted-foreground">Pedidos procesándose</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1</div>
                <p className="text-sm text-muted-foreground">Pedidos completados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Pedidos</CardTitle>
              <CardDescription>Seguimiento detallado del estado de cada pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {order.id} - {members.find(m => m.id === order.fk_id_socio)?.razon_social || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {providers.find(p => p.id === order.fk_id_proveedor)?.nombre || 'N/A'} • {order.fecha} • ${order.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          order.estado === "Entregado"
                            ? "default"
                            : order.estado === "Procesado"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {order.estado}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,540</div>
                <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio por Pedido</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,513</div>
                <p className="text-xs text-muted-foreground">Valor promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
                <Badge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">33%</div>
                <p className="text-xs text-muted-foreground">Pedidos entregados</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OrderForm({ 
  members, 
  providers, 
  products, 
  priceLists 
}: { 
  members: Socio[]
  providers: Proveedor[]
  products: Producto[]
  priceLists: ListaPrecio[]
}) {
  const [selectedMember, setSelectedMember] = useState("")
  const [selectedPriceList, setSelectedPriceList] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const currentPriceList = priceLists.find((list) => list.id === Number(selectedPriceList))
  const currentProvider = currentPriceList ? providers.find((p) => p.id === currentPriceList.fk_id_proveedor) : null

  const filteredProducts = currentPriceList
    ? [] // TODO: Implementar filtrado de productos cuando se tenga la relación con listas de precios
    : []

  const handleProductToggle = (item: PriceListItem) => {
    const product = products.find((p: Producto) => p.id === item.productId)

    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.productId === item.productId)
      if (existing) {
        return prev.filter((p) => p.productId !== item.productId)
      } else {
        if (!product) return prev
        return [
          ...prev,
          {
            productId: item.productId,
            product,
            price: item.price,
            discount: item.discount,
            quantity: 1,
          },
        ]
      }
    })
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setSelectedProducts((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity: newQuantity } : p)))
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const discountedPrice = item.price * (1 - item.discount / 100)
      return total + discountedPrice * item.quantity
    }, 0)
  }

  return (
    <div className="grid gap-6 py-4">
      {/* Información básica del pedido */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orderMember">Socio</Label>
          <select
            id="orderMember"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar socio...</option>
            {members
              .filter((m) => m.status === "Activo")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.razon_social}
                </option>
              ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="paymentMethod">Método de Pago</Label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar método...</option>
            <option value="cuenta_corriente">Cuenta Corriente</option>
            <option value="efectivo">Efectivo (10% desc.)</option>
            <option value="cheques">Cheques 30/60/90</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="priceList">Lista de Precios</Label>
        <select
          id="priceList"
          value={selectedPriceList}
          onChange={(e) => {
            setSelectedPriceList(e.target.value)
            setSelectedProducts([]) // Limpiar productos seleccionados al cambiar lista
            setSearchTerm("")
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Seleccionar lista de precios...</option>
          {priceLists.map((list) => {
            const provider = providers.find((p) => p.id === list.fk_id_proveedor)
            return (
              <option key={list.id} value={list.id}>
                {list.nombre} - {provider?.nombre}
              </option>
            )
          })}
        </select>
      </div>

      {currentPriceList && (
        <div className="grid gap-4">
          <div>
            <Label>Productos Disponibles</Label>
            <p className="text-sm text-muted-foreground">
              {currentPriceList?.nombre} - {currentProvider?.nombre}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos por nombre, código, marca o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center py-4">
              Funcionalidad de productos en desarrollo
            </p>
            {filteredProducts.length > 5 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Mostrando 5 de {filteredProducts.length} productos. Usa el buscador para encontrar productos
                específicos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos Seleccionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedProducts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{item.product.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(item.price * (1 - item.discount / 100)).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Number.parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline">Cancelar</Button>
        <Button disabled={!selectedMember || selectedProducts.length === 0 || !paymentMethod}>Crear Pedido</Button>
      </div>
    </div>
  )
}





