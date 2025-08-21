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
import { Plus, Edit, Eye, Package, ShoppingCart, TrendingUp, TrendingDown, Minus, Search, CheckCircle } from "lucide-react"
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
  getSocioByUserEmail,
  getSocioByUserId,
  getProductosConPrecios,
  getCondicionesCompraActivas
} from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase"
import { getCurrentUser, Usuario } from "@/lib/clerk-utils"
import { useUser } from "@clerk/nextjs"

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
  const { user: clerkUser } = useUser()
  const [members, setMembers] = useState<Socio[]>([])
  const [providers, setProviders] = useState<Proveedor[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [priceLists, setPriceLists] = useState<ListaPrecio[]>([])
  const [condicionesCompra, setCondicionesCompra] = useState<CondicionCompra[]>([])
  const [orders, setOrders] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)
  const [currentSocio, setCurrentSocio] = useState<Socio | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [productosConPrecios, setProductosConPrecios] = useState<any[]>([])
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarDatosDesdeSupabase()
  }, [clerkUser])

  // Función para cargar datos desde Supabase
  const cargarDatosDesdeSupabase = async () => {
    try {
      setLoading(true)
        
        // Obtener usuario actual desde Clerk
        if (clerkUser) {
          console.log('Clerk User:', clerkUser)
          console.log('Clerk User ID:', clerkUser.id)
          console.log('Clerk User Email:', clerkUser.emailAddresses[0]?.emailAddress)
          
          // Buscar el usuario en nuestra tabla de usuarios
          const user = await getCurrentUser()
          console.log('Usuario encontrado en BD:', user)
          setCurrentUser(user)
          
          // Si el usuario es socio, obtener su información
          if (user && user.rol === 'socio') {
            console.log('Usuario es socio, buscando socio asociado...')
            console.log('ID del usuario:', user.id)
            console.log('Email del usuario:', user.email)
            
            // Usar el ID del usuario directamente para buscar el socio
            const socio = await getSocioByUserId(user.id)
            console.log('Socio encontrado:', socio)
            
            if (socio) {
              console.log('Socio encontrado - ID:', socio.id, 'Razón social:', socio.razon_social)
              setCurrentSocio(socio)
            } else {
              console.log('NO se encontró socio para el usuario ID:', user.id)
              console.log('Intentando buscar por email como fallback...')
              
              // Intentar buscar por email como fallback
              const socioByEmail = await getSocioByUserEmail(user.email)
              console.log('Socio por email:', socioByEmail)
              
              if (socioByEmail) {
                console.log('Socio encontrado por email - ID:', socioByEmail.id, 'Razón social:', socioByEmail.razon_social)
                setCurrentSocio(socioByEmail)
              }
            }
          } else {
            console.log('Usuario NO es socio, rol:', user?.rol)
          }
        } else {
          console.log('No hay usuario logueado en Clerk')
        }
        
        // Cargar datos por separado para mejor debugging
        const membersData = await getSocios()
        const providersData = await getProveedores()
        const productsData = await getProductos()
        const priceListsData = await getListasPrecios()
        
        console.log('Intentando cargar condiciones de compra activas...')
        let condicionesData: CondicionCompra[] = []
        try {
          condicionesData = await getCondicionesCompraActivas()
          console.log('Condiciones de compra activas cargadas exitosamente:', condicionesData)
        } catch (err) {
          console.error('Error cargando condiciones de compra activas:', err)
          condicionesData = []
        }
        
        const ordersData = await getPedidos()
        
        console.log('Datos cargados:', {
          socios: membersData?.length || 0,
          proveedores: providersData?.length || 0,
          productos: productsData?.length || 0,
          listasPrecios: priceListsData?.length || 0,
          condicionesCompra: condicionesData?.length || 0,
          pedidos: ordersData?.length || 0
        })
        setMembers(membersData)
        setProviders(providersData)
        setProducts(productsData)
        setPriceLists(priceListsData)
        setCondicionesCompra(condicionesData)
        console.log('Condiciones de compra cargadas:', condicionesData)
        console.log('Total de condiciones:', condicionesData?.length || 0)
        setOrders(ordersData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }
  }, [clerkUser])

  // Función para cargar productos de un proveedor
  const cargarProductosProveedor = async (proveedorId: number) => {
    try {
      setLoadingProductos(true)
      const productos = await getProductosConPrecios(proveedorId)
      setProductosConPrecios(productos)
    } catch (err) {
      console.error('Error cargando productos del proveedor:', err)
      setProductosConPrecios([])
    } finally {
      setLoadingProductos(false)
    }
  }

  // Función para guardar pedido
  const handleSaveOrder = async (orderData: any) => {
    try {
      console.log('Guardando pedido:', orderData)
      
      // Crear el pedido en la base de datos
      const supabase = createClient()
      
      // Insertar el pedido principal
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          fk_id_socio: orderData.fk_id_socio,
          fk_id_proveedor: orderData.fk_id_proveedor,
          fecha: orderData.fecha,
          total: orderData.total,
          estado: 'Pendiente',
          fk_id_condicion_compra: orderData.fk_id_condicion_compra,
          observaciones: orderData.observaciones || null
        })
        .select()
        .single()
      
      if (pedidoError) {
        console.error('Error creando pedido:', pedidoError)
        throw new Error('Error al crear el pedido')
      }
      
      console.log('Pedido creado:', pedido)
      
      // Insertar los items del pedido
      const itemsToInsert = orderData.items.map((item: any) => ({
        fk_id_pedido: pedido.id,
        fk_id_producto: item.productId,
        cantidad: item.quantity,
        precio_unitario: item.price,
        descuento: item.discount,
        subtotal: item.price * item.quantity * (1 - item.discount / 100)
      }))
      
      const { error: itemsError } = await supabase
        .from('pedidos_items')
        .insert(itemsToInsert)
      
      if (itemsError) {
        console.error('Error creando items del pedido:', itemsError)
        throw new Error('Error al crear los items del pedido')
      }
      
      console.log('Items del pedido creados')
      
      // Recargar la lista de pedidos
      await cargarDatosDesdeSupabase()
      
      // Cerrar el diálogo
      setIsOrderDialogOpen(false)
      
      // Mostrar mensaje de éxito
      alert('Pedido creado exitosamente')
      
    } catch (err) {
      console.error('Error guardando pedido:', err)
      alert('Error al crear el pedido: ' + (err as Error).message)
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const añoActual = ahora.getFullYear()

    const pedidosEsteMes = orders.filter(order => {
      const fechaPedido = new Date(order.fecha)
      return fechaPedido.getMonth() === mesActual && fechaPedido.getFullYear() === añoActual
    })

    const pedidosMesAnterior = orders.filter(order => {
      const fechaPedido = new Date(order.fecha)
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
      const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual
      return fechaPedido.getMonth() === mesAnterior && fechaPedido.getFullYear() === añoAnterior
    })

    const totalEsteMes = pedidosEsteMes.reduce((sum, order) => sum + order.total, 0)
    const totalMesAnterior = pedidosMesAnterior.reduce((sum, order) => sum + order.total, 0)

    const variacionPorcentual = totalMesAnterior > 0
      ? ((totalEsteMes - totalMesAnterior) / totalMesAnterior) * 100
      : 0

    const promedioPorPedido = pedidosEsteMes.length > 0
      ? totalEsteMes / pedidosEsteMes.length
      : 0

    const pedidosEntregados = orders.filter(order => order.estado === 'Entregado').length
    const tasaEntrega = orders.length > 0
      ? (pedidosEntregados / orders.length) * 100
      : 0

    return {
      totalPedidos: pedidosEsteMes.length,
      valorTotal: totalEsteMes,
      variacionPorcentual: variacionPorcentual,
      promedioPorPedido: promedioPorPedido,
      tasaEntrega: tasaEntrega,
      pedidosEntregados: pedidosEntregados,
      totalPedidosGeneral: orders.length
    }
  }

  const stats = calcularEstadisticas()

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
            <OrderForm 
              members={members} 
              providers={providers} 
              products={products} 
              priceLists={priceLists}
              condicionesCompra={condicionesCompra}
              currentUser={currentUser}
              currentSocio={currentSocio}
              onSave={handleSaveOrder}
              onCancel={() => setIsOrderDialogOpen(false)}
              cargarProductosProveedor={cargarProductosProveedor}
              productosConPrecios={productosConPrecios}
              loadingProductos={loadingProductos}
              setProductosConPrecios={setProductosConPrecios}
            />
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
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        {members.find(m => m.id === order.fk_id_socio)?.razon_social || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {providers.find(p => p.id === order.fk_id_proveedor)?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>{order.fecha}</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell className="font-medium">${order.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {condicionesCompra.find(c => c.id === order.fk_id_condicion_compra)?.nombre || 'N/A'}
                        </Badge>
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
                        >
                          {order.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <div className="text-2xl font-bold text-orange-600">
                  {orders.filter(order => order.estado === 'Pendiente').length}
                </div>
                <p className="text-sm text-muted-foreground">Pedidos por procesar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">En Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {orders.filter(order => order.estado === 'Procesado').length}
                </div>
                <p className="text-sm text-muted-foreground">Pedidos procesándose</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.estado === 'Entregado').length}
                </div>
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
                <div className="text-2xl font-bold">{stats.totalPedidos}</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.valorTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.variacionPorcentual > 0 ? (
                    <span className="text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{stats.variacionPorcentual.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {stats.variacionPorcentual.toFixed(1)}%
                    </span>
                  )}
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio por Pedido</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.promedioPorPedido.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Valor promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasaEntrega.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pedidosEntregados} de {stats.totalPedidosGeneral} pedidos
                </p>
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
  priceLists,
  condicionesCompra,
  currentUser,
  currentSocio,
  onSave,
  onCancel,
  cargarProductosProveedor,
  productosConPrecios,
  loadingProductos,
  setProductosConPrecios
}: { 
  members: Socio[]
  providers: Proveedor[]
  products: Producto[]
  priceLists: ListaPrecio[]
  condicionesCompra: CondicionCompra[]
  currentUser: Usuario | null
  currentSocio: Socio | null
  onSave: (orderData: any) => Promise<void>
  onCancel: () => void
  cargarProductosProveedor: (proveedorId: number) => Promise<void>
  productosConPrecios: any[]
  loadingProductos: boolean
  setProductosConPrecios: (productos: any[]) => void
}) {
  const [activeTab, setActiveTab] = useState("general")
  const [saving, setSaving] = useState(false)
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    fk_id_socio: currentSocio?.id || 0,
    fk_id_proveedor: 0,
    fecha: new Date().toISOString().split('T')[0],
    fk_id_condicion_compra: 0,
    observaciones: "",
    estado: "Pendiente"
  })

  // Actualizar formData cuando currentSocio cambie
  useEffect(() => {
    console.log('useEffect currentSocio cambió:', currentSocio)
    if (currentSocio) {
      console.log('Actualizando formData con socio ID:', currentSocio.id)
      setFormData(prev => ({ ...prev, fk_id_socio: currentSocio.id }))
    }
  }, [currentSocio])
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Calcular total
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const discountedPrice = item.price * (1 - item.discount / 100)
      return total + discountedPrice * item.quantity
    }, 0)
  }

  // Manejar cambio de proveedor
  const handleProveedorChange = async (proveedorId: number) => {
    setFormData(prev => ({ ...prev, fk_id_proveedor: proveedorId }))
    setSelectedProducts([]) // Limpiar productos seleccionados
    setSearchTerm("") // Limpiar búsqueda
    
    if (proveedorId) {
      await cargarProductosProveedor(proveedorId)
    } else {
      setProductosConPrecios([])
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fk_id_socio || !formData.fk_id_proveedor || selectedProducts.length === 0) {
      alert('Por favor complete todos los campos obligatorios y seleccione al menos un producto')
      return
    }
    
    try {
      setSaving(true)
      await onSave({ ...formData, total: calculateTotal(), items: selectedProducts })
    } catch (err) {
      console.error('Error guardando pedido:', err)
    } finally {
      setSaving(false)
    }
  }

  // Agregar producto al pedido
  const addProduct = (product: any) => {
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      setSelectedProducts(prev => prev.map(p => 
        p.productId === product.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ))
    } else {
      setSelectedProducts(prev => [...prev, {
        productId: product.id,
        product,
        price: product.precio || 0,
        discount: product.descuento || 0,
        quantity: 1
      }])
    }
  }

  // Remover producto del pedido
  const removeProduct = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId))
  }

  // Actualizar cantidad
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return
    setSelectedProducts(prev => prev.map(p => 
      p.productId === productId ? { ...p, quantity } : p
    ))
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="socio">Socio</Label>
                {currentSocio ? (
                  <div>
                    <Input
                      id="socio"
                      value={currentSocio.razon_social}
                      className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm"
                      readOnly
                      required
                    />
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Socio automáticamente seleccionado (ID: {currentSocio.id})
                    </p>
                  </div>
                ) : (
                  <select
                    id="socio"
                    value={formData.fk_id_socio}
                    onChange={(e) => setFormData(prev => ({ ...prev, fk_id_socio: Number(e.target.value) }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
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
                )}

              </div>
              <div className="grid gap-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <select
                  id="proveedor"
                  value={formData.fk_id_proveedor}
                  onChange={(e) => handleProveedorChange(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar proveedor...</option>
                  {providers
                    .filter((p) => p.status === "Activo")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha">Fecha del Pedido</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condicion_compra">Condición de Compra</Label>
                <select
                  id="condicion_compra"
                  value={formData.fk_id_condicion_compra}
                  onChange={(e) => setFormData(prev => ({ ...prev, fk_id_condicion_compra: Number(e.target.value) }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar condición...</option>
                  {condicionesCompra.length > 0 ? (
                    condicionesCompra
                      .filter((c) => c.activo === true)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} - {c.descripcion}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No hay condiciones disponibles</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Observaciones adicionales del pedido..."
              />
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {formData.fk_id_proveedor ? (
              <div className="space-y-4">
                <div>
                  <Label>Productos Disponibles</Label>
                  <p className="text-sm text-muted-foreground">
                    {providers.find(p => p.id === formData.fk_id_proveedor)?.nombre}
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

                {loadingProductos ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : productosConPrecios.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {productosConPrecios
                        .filter(product =>
                          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                Código: {product.codigo} | Categoría: {product.categoria}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Precio: ${product.precio?.toLocaleString()} | Descuento: {product.descuento}%
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addProduct(product)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>

                    {selectedProducts.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">Artículos Agregados al Pedido</h4>
                        <div className="space-y-2">
                          {selectedProducts.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.product.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${(item.price * (1 - item.discount / 100)).toLocaleString()} c/u
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
                                <span className="text-sm font-medium min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeProduct(item.productId)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-medium text-sm">
                              <span>Subtotal:</span>
                              <span>${calculateTotal().toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron productos para este proveedor
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Selecciona un proveedor para ver sus productos
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Socio</p>
                  <p className="text-sm text-muted-foreground">
                    {members.find(m => m.id === formData.fk_id_socio)?.razon_social || 'No seleccionado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Proveedor</p>
                  <p className="text-sm text-muted-foreground">
                    {providers.find(p => p.id === formData.fk_id_proveedor)?.nombre || 'No seleccionado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Fecha</p>
                  <p className="text-sm text-muted-foreground">{formData.fecha}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Condición de Compra</p>
                  <p className="text-sm text-muted-foreground">
                    {condicionesCompra.find(c => c.id === formData.fk_id_condicion_compra)?.nombre || 'No seleccionado'}
                  </p>
                </div>
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Productos Seleccionados</p>
                  {selectedProducts.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.product.nombre}</span>
                        <p className="text-xs text-muted-foreground">
                          ${(item.price * (1 - item.discount / 100)).toLocaleString()} c/u
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </form>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button 
          type="submit" 
          className="bg-black text-white hover:bg-gray-800"
          disabled={!formData.fk_id_socio || !formData.fk_id_proveedor || selectedProducts.length === 0 || saving}
        >
          {saving ? "Creando..." : "Crear Pedido"}
        </Button>
      </div>
    </div>
  )
}

