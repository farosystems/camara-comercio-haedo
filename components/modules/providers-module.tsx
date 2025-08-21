"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Upload, Edit, Trash2, FileSpreadsheet, DollarSign, CreditCard, Banknote, Package } from "lucide-react"
import { 
  Proveedor, 
  Producto, 
  ListaPrecio, 
  CondicionCompra,
  getProveedores,
  getProductos,
  getListasPrecios,
  getCondicionesCompra,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  crearListaPrecio,
  actualizarListaPrecio,
  eliminarListaPrecio,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  eliminarCondicionCompra,
  crearCondicionCompra,
  actualizarCondicionCompra
} from "@/lib/supabase-admin"

export function ProvidersModule() {
  const [providers, setProviders] = useState<Proveedor[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [priceLists, setPriceLists] = useState<ListaPrecio[]>([])
  const [purchaseConditions, setPurchaseConditions] = useState<CondicionCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)

  // Función para mostrar errores en popup
  const showError = (message: string) => {
    setError(message)
    setShowErrorDialog(true)
  }

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [providersData, productsData, priceListsData, conditionsData] = await Promise.all([
          getProveedores(),
          getProductos(),
          getListasPrecios(),
          getCondicionesCompra()
        ])
        setProviders(providersData)
        setProducts(productsData)
        setPriceLists(priceListsData)
        setPurchaseConditions(conditionsData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])



  const [editingCondition, setEditingCondition] = useState<CondicionCompra | null>(null)
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Proveedor | null>(null)
  const [providerFormData, setProviderFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    cuit: '',
    direccion: '',
    metodos_pago: {
      efectivo: false,
      transferencia: false,
      cheque: false,
      tarjeta_credito: false,
      tarjeta_debito: false,
      otros: false
    },
    status: 'Activo' as 'Activo' | 'Inactivo'
  })
  const [savingProvider, setSavingProvider] = useState(false)
  const [deletingProvider, setDeletingProvider] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<Proveedor | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Estados para listas de precios
  const [isPriceListDialogOpen, setIsPriceListDialogOpen] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState<ListaPrecio | null>(null)
  const [priceListFormData, setPriceListFormData] = useState({
    nombre: '',
    fk_id_proveedor: 0,
    status: 'Activa' as 'Activa' | 'Inactiva' | 'Vencida'
  })
  const [savingPriceList, setSavingPriceList] = useState(false)
  const [deletingPriceList, setDeletingPriceList] = useState(false)
  const [priceListToDelete, setPriceListToDelete] = useState<ListaPrecio | null>(null)
  const [isDeletePriceListDialogOpen, setIsDeletePriceListDialogOpen] = useState(false)
  
  // Estados para productos
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null)
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] = useState(false)
  
  // Estados para condiciones de compra
  const [savingCondition, setSavingCondition] = useState(false)
  const [deletingCondition, setDeletingCondition] = useState(false)
  const [conditionToDelete, setConditionToDelete] = useState<CondicionCompra | null>(null)
  const [isDeleteConditionDialogOpen, setIsDeleteConditionDialogOpen] = useState(false)

  const handleMetodoPagoChange = (metodo: string, checked: boolean) => {
    setProviderFormData(prev => ({
      ...prev,
      metodos_pago: {
        ...prev.metodos_pago,
        [metodo]: checked
      }
    }))
  }

  const handleEditProvider = (provider: Proveedor) => {
    setEditingProvider(provider)
    setProviderFormData({
      nombre: provider.nombre,
      contacto: provider.contacto,
      telefono: provider.telefono,
      email: provider.email,
      cuit: provider.cuit,
      direccion: provider.direccion || '',
      metodos_pago: provider.metodos_pago || {
        efectivo: false,
        transferencia: false,
        cheque: false,
        tarjeta_credito: false,
        tarjeta_debito: false,
        otros: false
      },
      status: provider.status as 'Activo' | 'Inactivo'
    })
    setIsProviderDialogOpen(true)
  }

  const handleDeleteProvider = (provider: Proveedor) => {
    setProviderToDelete(provider)
    setIsDeleteDialogOpen(true)
  }

  const handleEditPriceList = (priceList: ListaPrecio) => {
    setEditingPriceList(priceList)
    setPriceListFormData({
      nombre: priceList.nombre,
      fk_id_proveedor: priceList.fk_id_proveedor,
      status: priceList.status as 'Activa' | 'Inactiva' | 'Vencida'
    })
    setIsPriceListDialogOpen(true)
  }

  const handleDeletePriceList = (priceList: ListaPrecio) => {
    setPriceListToDelete(priceList)
    setIsDeletePriceListDialogOpen(true)
  }

  const confirmDeletePriceList = async () => {
    if (!priceListToDelete) return
    
    try {
      setDeletingPriceList(true)
      setError(null)
      
      await eliminarListaPrecio(priceListToDelete.id)
      setPriceLists(prev => prev.filter(p => p.id !== priceListToDelete.id))
      setIsDeletePriceListDialogOpen(false)
      setPriceListToDelete(null)
    } catch (err: any) {
      console.error('Error eliminando lista de precios:', err)
      // Mostrar el mensaje específico de validación si existe
      if (err.message && err.message.includes('No se puede eliminar')) {
        showError(err.message)
        // Cerrar el diálogo de confirmación y mostrar el error
        setIsDeletePriceListDialogOpen(false)
        setPriceListToDelete(null)
      } else {
        showError('Error al eliminar la lista de precios')
      }
    } finally {
      setDeletingPriceList(false)
    }
  }

  const handleSavePriceList = async () => {
    try {
      setSavingPriceList(true)
      setError(null)
      
      if (editingPriceList) {
        // Actualizar lista existente
        const updatedPriceList = await actualizarListaPrecio(editingPriceList.id, {
          nombre: priceListFormData.nombre,
          fk_id_proveedor: priceListFormData.fk_id_proveedor,
          status: priceListFormData.status
        })
        
        setPriceLists(prev => prev.map(p => p.id === editingPriceList.id ? updatedPriceList : p))
      } else {
        // Crear nueva lista
        const newPriceList = await crearListaPrecio({
          nombre: priceListFormData.nombre,
          fk_id_proveedor: priceListFormData.fk_id_proveedor,
          fecha_carga: new Date().toISOString().split('T')[0], // Solo la fecha sin la hora
          status: priceListFormData.status
        })
        
        setPriceLists(prev => [...prev, newPriceList])
      }
      
      // Limpiar formulario
      setPriceListFormData({
        nombre: '',
        fk_id_proveedor: 0,
        status: 'Activa'
      })
      setEditingPriceList(null)
      setIsPriceListDialogOpen(false)
    } catch (err) {
      console.error('Error guardando lista de precios:', err)
      showError('Error al guardar la lista de precios')
    } finally {
      setSavingPriceList(false)
    }
  }

  const confirmDeleteProvider = async () => {
    if (!providerToDelete) return
    
    try {
      setDeletingProvider(true)
      setError(null)
      
      await eliminarProveedor(providerToDelete.id)
      setProviders(prev => prev.filter(p => p.id !== providerToDelete.id))
      setIsDeleteDialogOpen(false)
      setProviderToDelete(null)
    } catch (err: any) {
      console.error('Error eliminando proveedor:', err)
      // Mostrar el mensaje específico de validación si existe
      if (err.message && err.message.includes('No se puede eliminar')) {
        showError(err.message)
        // Cerrar el diálogo de confirmación y mostrar el error
        setIsDeleteDialogOpen(false)
        setProviderToDelete(null)
      } else {
        showError('Error al eliminar el proveedor')
      }
    } finally {
      setDeletingProvider(false)
    }
  }

  const handleSaveProvider = async () => {
    try {
      setSavingProvider(true)
      setError(null)
      
      if (editingProvider) {
        // Actualizar proveedor existente
        const updatedProvider = await actualizarProveedor(editingProvider.id, {
          nombre: providerFormData.nombre,
          contacto: providerFormData.contacto,
          telefono: providerFormData.telefono,
          email: providerFormData.email,
          cuit: providerFormData.cuit,
          direccion: providerFormData.direccion,
          metodos_pago: providerFormData.metodos_pago,
          status: providerFormData.status
        })
        
        setProviders(prev => prev.map(p => p.id === editingProvider.id ? updatedProvider : p))
      } else {
        // Crear nuevo proveedor
        const newProvider = await crearProveedor({
          nombre: providerFormData.nombre,
          contacto: providerFormData.contacto,
          telefono: providerFormData.telefono,
          email: providerFormData.email,
          cuit: providerFormData.cuit,
          direccion: providerFormData.direccion,
          metodos_pago: providerFormData.metodos_pago,
          status: providerFormData.status
        })
        
        setProviders(prev => [...prev, newProvider])
      }
      
      // Limpiar formulario
      setProviderFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        cuit: '',
        direccion: '',
        metodos_pago: {
          efectivo: false,
          transferencia: false,
          cheque: false,
          tarjeta_credito: false,
          tarjeta_debito: false,
          otros: false
        },
        status: 'Activo'
      })
      setEditingProvider(null)
      setIsProviderDialogOpen(false)
    } catch (err) {
      console.error('Error guardando proveedor:', err)
      showError('Error al guardar el proveedor')
    } finally {
      setSavingProvider(false)
    }
  }

  const handleSaveCondition = async (conditionData: Partial<CondicionCompra>) => {
    try {
      setSavingCondition(true)
      setError(null)
      
      if (editingCondition) {
        // Actualizar condición existente
        const updatedCondition = await actualizarCondicionCompra(editingCondition.id, conditionData)
        setPurchaseConditions(prev => prev.map(c => c.id === editingCondition.id ? updatedCondition : c))
      } else {
        // Crear nueva condición
        const newCondition = await crearCondicionCompra({
          nombre: conditionData.nombre || "",
          tipo: conditionData.tipo || "Cuenta Corriente",
          descripcion: conditionData.descripcion || "",
          descuento: conditionData.descuento || 0,
          recargo: conditionData.recargo || 0,
          dias_pago: conditionData.dias_pago || 0,
          activo: conditionData.activo ?? true,
          fk_id_proveedor: conditionData.fk_id_proveedor || null
        })
        setPurchaseConditions(prev => [...prev, newCondition])
      }
      
      setEditingCondition(null)
      setIsConditionDialogOpen(false)
    } catch (err: any) {
      console.error('Error guardando condición de compra:', err)
      // Mostrar el mensaje específico del error si existe
      if (err.message) {
        showError(`Error al guardar la condición de compra: ${err.message}`)
      } else {
        showError('Error al guardar la condición de compra')
      }
    } finally {
      setSavingCondition(false)
    }
  }

  const handleDeleteCondition = (condition: CondicionCompra) => {
    setConditionToDelete(condition)
    setIsDeleteConditionDialogOpen(true)
  }

  const confirmDeleteCondition = async () => {
    if (!conditionToDelete) return
    
    try {
      setDeletingCondition(true)
      setError(null)
      
      await eliminarCondicionCompra(conditionToDelete.id)
      setPurchaseConditions(prev => prev.filter(c => c.id !== conditionToDelete.id))
      setIsDeleteConditionDialogOpen(false)
      setConditionToDelete(null)
    } catch (err: any) {
      console.error('Error eliminando condición de compra:', err)
      // Mostrar el mensaje específico de validación si existe
      if (err.message && err.message.includes('No se puede eliminar')) {
        showError(err.message)
        // Cerrar el diálogo de confirmación y mostrar el error
        setIsDeleteConditionDialogOpen(false)
        setConditionToDelete(null)
      } else {
        showError('Error al eliminar la condición de compra')
      }
    } finally {
      setDeletingCondition(false)
    }
  }

  const handleEditCondition = (condition: CondicionCompra) => {
    setEditingCondition(condition)
    setIsConditionDialogOpen(true)
  }

  const handleSaveProduct = async (productData: Partial<Producto>) => {
    try {
      setSavingProduct(true)
      setError(null)
      
      if (editingProduct) {
        // Actualizar producto existente
        const updatedProduct = await actualizarProducto(editingProduct.id, productData)
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p))
      } else {
        // Crear nuevo producto
        const newProduct = await crearProducto({
          codigo: productData.codigo || "",
          nombre: productData.nombre || "",
          categoria: productData.categoria || "",
          marca: productData.marca || "",
          descripcion: productData.descripcion || null,
          precio: productData.precio || 0,
          fk_id_lista_precio: productData.fk_id_lista_precio || null,
          activo: productData.activo ?? true
        })
        setProducts(prev => [...prev, newProduct])
      }
      
      setEditingProduct(null)
      setIsProductDialogOpen(false)
    } catch (err) {
      console.error('Error guardando producto:', err)
      showError('Error al guardar el producto')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleDeleteProduct = (product: Producto) => {
    setProductToDelete(product)
    setIsDeleteProductDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      setDeletingProduct(true)
      setError(null)
      
      await eliminarProducto(productToDelete.id)
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
      setIsDeleteProductDialogOpen(false)
      setProductToDelete(null)
    } catch (err: any) {
      console.error('Error eliminando producto:', err)
      // Mostrar el mensaje específico de validación si existe
      if (err.message && err.message.includes('No se puede eliminar')) {
        showError(err.message)
        // Cerrar el diálogo de confirmación y mostrar el error
        setIsDeleteProductDialogOpen(false)
        setProductToDelete(null)
      } else {
        showError('Error al eliminar el producto')
      }
    } finally {
      setDeletingProduct(false)
    }
  }

  const handleEditProduct = (product: Producto) => {
    setEditingProduct(product)
    setIsProductDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Proveedores</h2>
          <p className="text-muted-foreground">
            Administra proveedores, productos, listas de precios y condiciones de compra
          </p>
        </div>
        <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => {
                setEditingProvider(null)
                setProviderFormData({
                  nombre: '',
                  contacto: '',
                  telefono: '',
                  email: '',
                  cuit: '',
                  direccion: '',
                  metodos_pago: {
                    efectivo: false,
                    transferencia: false,
                    cheque: false,
                    tarjeta_credito: false,
                    tarjeta_debito: false,
                    otros: false
                  },
                  status: 'Activo'
                })
                setIsProviderDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>{editingProvider ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}</DialogTitle>
              <DialogDescription>Completa la información del proveedor</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  placeholder="Nombre del proveedor" 
                  value={providerFormData.nombre}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contacto</Label>
                <Input 
                  id="contact" 
                  placeholder="Persona de contacto" 
                  value={providerFormData.contacto}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, contacto: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input 
                  id="telefono" 
                  placeholder="+54 11 1234-5678" 
                  value={providerFormData.telefono}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@proveedor.com" 
                  value={providerFormData.email}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input 
                  id="cuit" 
                  placeholder="20-12345678-9" 
                  value={providerFormData.cuit}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, cuit: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea 
                  id="direccion" 
                  placeholder="Dirección completa del proveedor" 
                  value={providerFormData.direccion}
                  onChange={(e) => setProviderFormData(prev => ({ ...prev, direccion: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Métodos de Pago</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="efectivo"
                      checked={providerFormData.metodos_pago.efectivo}
                      onCheckedChange={(checked) => handleMetodoPagoChange('efectivo', checked as boolean)}
                    />
                    <Label htmlFor="efectivo" className="text-sm">Efectivo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="transferencia"
                      checked={providerFormData.metodos_pago.transferencia}
                      onCheckedChange={(checked) => handleMetodoPagoChange('transferencia', checked as boolean)}
                    />
                    <Label htmlFor="transferencia" className="text-sm">Transferencia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cheque"
                      checked={providerFormData.metodos_pago.cheque}
                      onCheckedChange={(checked) => handleMetodoPagoChange('cheque', checked as boolean)}
                    />
                    <Label htmlFor="cheque" className="text-sm">Cheque</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="tarjeta_credito"
                      checked={providerFormData.metodos_pago.tarjeta_credito}
                      onCheckedChange={(checked) => handleMetodoPagoChange('tarjeta_credito', checked as boolean)}
                    />
                    <Label htmlFor="tarjeta_credito" className="text-sm">Tarjeta de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="tarjeta_debito"
                      checked={providerFormData.metodos_pago.tarjeta_debito}
                      onCheckedChange={(checked) => handleMetodoPagoChange('tarjeta_debito', checked as boolean)}
                    />
                    <Label htmlFor="tarjeta_debito" className="text-sm">Tarjeta de Débito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="otros"
                      checked={providerFormData.metodos_pago.otros}
                      onCheckedChange={(checked) => handleMetodoPagoChange('otros', checked as boolean)}
                    />
                    <Label htmlFor="otros" className="text-sm">Otros</Label>
                  </div>
                </div>
              </div>
            </div>
            {error && (
              <div className="text-red-600 text-sm mb-4">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsProviderDialogOpen(false)}
                disabled={savingProvider}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleSaveProvider}
                disabled={savingProvider || !providerFormData.nombre || !providerFormData.contacto}
              >
                {savingProvider ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar el proveedor "{providerToDelete?.nombre}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deletingProvider}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteProvider}
                disabled={deletingProvider}
              >
                {deletingProvider ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar productos */}
        <Dialog open={isDeleteProductDialogOpen} onOpenChange={setIsDeleteProductDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar el producto "{productToDelete?.nombre}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteProductDialogOpen(false)}
                disabled={deletingProduct}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteProduct}
                disabled={deletingProduct}
              >
                {deletingProduct ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar condiciones de compra */}
        <Dialog open={isDeleteConditionDialogOpen} onOpenChange={setIsDeleteConditionDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar la condición de compra "{conditionToDelete?.nombre}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteConditionDialogOpen(false)}
                disabled={deletingCondition}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteCondition}
                disabled={deletingCondition}
              >
                {deletingCondition ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Error */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle className="text-red-600">Error</DialogTitle>
              <DialogDescription className="text-gray-700">
                {error}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setShowErrorDialog(false)}
              >
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="providers" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Proveedores</TabsTrigger>
          <TabsTrigger value="pricelists" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Listas de Precios</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Productos</TabsTrigger>
          <TabsTrigger value="conditions" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Condiciones de Compra</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proveedores Registrados</CardTitle>
              <CardDescription>Lista de todos los proveedores del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Contacto</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">CUIT</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.nombre}</TableCell>
                      <TableCell>{provider.contacto}</TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell>{provider.cuit}</TableCell>
                      <TableCell>
                        <Badge variant={provider.status === "Activo" ? "default" : "secondary"} className={provider.status === "Activo" ? "bg-black text-white" : "bg-gray-100 text-gray-700"}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => handleEditProvider(provider)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => handleDeleteProvider(provider)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={() => setEditingProduct(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-xl text-black">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                  <DialogDescription>Gestiona el catálogo de productos disponibles</DialogDescription>
                </DialogHeader>
                <ProductForm
                  product={editingProduct}
                  priceLists={priceLists}
                  providers={providers}
                  onSave={handleSaveProduct}
                  onCancel={() => {
                    setEditingProduct(null)
                    setIsProductDialogOpen(false)
                  }}
                  saving={savingProduct}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Productos</CardTitle>
              <CardDescription>Productos disponibles para incluir en listas de precios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Lista de Precios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const priceList = product.fk_id_lista_precio ? priceLists.find((list) => list.id === product.fk_id_lista_precio) : null
                    const provider = priceList ? providers.find((p) => p.id === priceList.fk_id_proveedor) : null
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.codigo}</TableCell>
                        <TableCell>{product.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.categoria}</Badge>
                        </TableCell>
                        <TableCell>{product.marca}</TableCell>
                        <TableCell className="font-medium">
                          ${product.precio?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </TableCell>
                        <TableCell>
                          {priceList ? (
                            <div className="text-sm">
                              <div className="font-medium">{priceList.nombre}</div>
                              <div className="text-muted-foreground">{provider?.nombre}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                                                  <Badge variant={product.activo ? "default" : "secondary"}>
                          {product.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Estadísticas de productos */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Total Productos</CardTitle>
                <Package className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">productos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Productos Activos</CardTitle>
                <Package className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.filter((p) => p.activo).length}</div>
                <p className="text-xs text-muted-foreground">disponibles para venta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Con Lista de Precios</CardTitle>
                <DollarSign className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.filter((p) => p.fk_id_lista_precio).length}</div>
                <p className="text-xs text-muted-foreground">con precios asignados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Categorías</CardTitle>
                <Package className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(products.map((p) => p.categoria)).size}</div>
                <p className="text-xs text-muted-foreground">categorías diferentes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricelists" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Dialog open={isPriceListDialogOpen} onOpenChange={setIsPriceListDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={() => {
                    setEditingPriceList(null)
                    setPriceListFormData({
                      nombre: '',
                      fk_id_proveedor: 0,
                      status: 'Activa'
                    })
                    setIsPriceListDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Lista de Precios
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
                <DialogHeader>
                  <DialogTitle>{editingPriceList ? "Editar Lista de Precios" : "Nueva Lista de Precios"}</DialogTitle>
                  <DialogDescription>Completa la información de la lista de precios</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priceListName">Nombre de la Lista</Label>
                    <Input 
                      id="priceListName" 
                      placeholder="Ej: Lista Enero 2025" 
                      value={priceListFormData.nombre}
                      onChange={(e) => setPriceListFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priceListProvider">Proveedor</Label>
                    <Select 
                      value={priceListFormData.fk_id_proveedor.toString()} 
                      onValueChange={(value) => setPriceListFormData(prev => ({ ...prev, fk_id_proveedor: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priceListStatus">Estado</Label>
                    <Select 
                      value={priceListFormData.status} 
                      onValueChange={(value) => setPriceListFormData(prev => ({ ...prev, status: value as 'Activa' | 'Inactiva' | 'Vencida' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Inactiva">Inactiva</SelectItem>
                        <SelectItem value="Vencida">Vencida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && (
                  <div className="text-red-600 text-sm mb-4">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPriceListDialogOpen(false)}
                    disabled={savingPriceList}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={handleSavePriceList}
                    disabled={savingPriceList || !priceListFormData.nombre || !priceListFormData.fk_id_proveedor}
                  >
                    {savingPriceList ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Lista de Precios
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-0 shadow-2xl rounded-xl text-black">
                <DialogHeader>
                  <DialogTitle>Importar Lista de Precios</DialogTitle>
                  <DialogDescription>Sube un archivo Excel (.xlsx) o CSV con la lista de precios</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Proveedor</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Seleccionar proveedor...</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input id="file" type="file" accept=".xlsx,.csv" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Formato esperado:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Columna A: Código del producto (debe existir en catálogo)</li>
                      <li>Columna B: Precio</li>
                      <li>Columna C: Descuento (opcional)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Importar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listas de Precios</CardTitle>
              <CardDescription>Listas de precios por proveedor con productos y precios específicos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Lista</TableHead>
                    <TableHead>Fecha de Carga</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceLists.map((list) => {
                    const provider = providers.find((p) => p.id === list.fk_id_proveedor)
                    return (
                      <TableRow key={list.id}>
                        <TableCell className="font-medium">{provider?.nombre}</TableCell>
                        <TableCell>{list.nombre}</TableCell>
                        <TableCell>
                          {list.fecha_carga ? new Date(list.fecha_carga + 'T00:00:00').toLocaleDateString('es-AR') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{list.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-xl text-black">
                                <DialogHeader>
                                  <DialogTitle>Detalle de Lista de Precios</DialogTitle>
                                  <DialogDescription>
                                    {list.nombre} - {provider?.nombre}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-96 overflow-y-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Descuento</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                          No hay productos en esta lista de precios
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditPriceList(list)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePriceList(list)}
                            >
                              <Trash2 className="h-4 w-4" />
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

        <TabsContent value="conditions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isConditionDialogOpen} onOpenChange={setIsConditionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={() => setEditingCondition(null)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Condición
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-xl text-black">
                <DialogHeader>
                  <DialogTitle>
                    {editingCondition ? "Editar Condición de Compra" : "Nueva Condición de Compra"}
                  </DialogTitle>
                  <DialogDescription>Define las condiciones comerciales para los proveedores</DialogDescription>
                </DialogHeader>
                <PurchaseConditionForm
                  condition={editingCondition}
                  providers={providers}
                  onSave={handleSaveCondition}
                  onCancel={() => {
                    setEditingCondition(null)
                    setIsConditionDialogOpen(false)
                  }}
                  saving={savingCondition}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Condiciones de Compra</CardTitle>
              <CardDescription>Gestiona las condiciones comerciales y métodos de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Recargo</TableHead>
                    <TableHead>Días de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseConditions.map((condition) => {
                    const provider = condition.fk_id_proveedor ? providers.find((p) => p.id === condition.fk_id_proveedor) : null
                    return (
                      <TableRow key={condition.id}>
                        <TableCell className="font-medium">{condition.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {condition.tipo === "Cuenta Corriente" && "Cuenta Corriente"}
                            {condition.tipo === "Efectivo" && "Efectivo"}
                            {condition.tipo === "Cheques" && "Cheques"}
                            {condition.tipo === "Transferencia" && "Transferencia"}
                          </Badge>
                        </TableCell>
                        <TableCell>{provider ? provider.nombre : "Todos los proveedores"}</TableCell>
                        <TableCell>{condition.descuento > 0 ? `${condition.descuento}%` : "-"}</TableCell>
                        <TableCell>{condition.recargo > 0 ? `${condition.recargo}%` : "-"}</TableCell>
                        <TableCell>{condition.dias_pago} días</TableCell>
                        <TableCell>
                          <Badge variant={condition.activo ? "default" : "secondary"}>
                            {condition.activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCondition(condition)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCondition(condition)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Resumen de condiciones */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Condiciones Activas</CardTitle>
                <CreditCard className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseConditions.filter((c) => c.activo).length}</div>
                <p className="text-xs text-muted-foreground">de {purchaseConditions.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Con Descuento</CardTitle>
                <Banknote className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseConditions.filter((c) => c.descuento > 0).length}</div>
                <p className="text-xs text-muted-foreground">condiciones con descuento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-base">Pago Diferido</CardTitle>
                <DollarSign className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseConditions.filter((c) => c.dias_pago > 0).length}</div>
                <p className="text-xs text-muted-foreground">condiciones a plazo</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar lista de precios */}
      <Dialog open={isDeletePriceListDialogOpen} onOpenChange={setIsDeletePriceListDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-2xl rounded-xl text-black">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la lista de precios "{priceListToDelete?.nombre}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeletePriceListDialogOpen(false)}
              disabled={deletingPriceList}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDeletePriceList}
              disabled={deletingPriceList}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingPriceList ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductForm({ 
  product, 
  priceLists, 
  providers, 
  onSave, 
  onCancel,
  saving = false
}: { 
  product: Producto | null
  priceLists: ListaPrecio[]
  providers: Proveedor[]
  onSave: (data: Partial<Producto>) => Promise<void>
  onCancel: () => void
  saving?: boolean
}) {
  const [formData, setFormData] = useState({
    codigo: product?.codigo || "",
    nombre: product?.nombre || "",
    categoria: product?.categoria || "",
    marca: product?.marca || "",
    descripcion: product?.descripcion || "",
    precio: product?.precio || 0,
    fk_id_lista_precio: product?.fk_id_lista_precio || null,
    activo: product?.activo ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="codigo">Código del Producto</Label>
        <Input
          id="codigo"
          value={formData.codigo}
          onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
          placeholder="Ej: GTR-001"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nombre">Nombre del Producto</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Guitarra Acústica Yamaha FG800"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Input
            id="categoria"
            value={formData.categoria}
            onChange={(e) => setFormData((prev) => ({ ...prev, categoria: e.target.value }))}
            placeholder="Ej: Guitarras"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="marca">Marca</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => setFormData((prev) => ({ ...prev, marca: e.target.value }))}
            placeholder="Ej: Yamaha"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Descripción detallada del producto..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="precio">Precio</Label>
        <Input
          id="precio"
          type="number"
          step="0.01"
          min="0"
          value={formData.precio}
          onChange={(e) => setFormData((prev) => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
          placeholder="0.00"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="priceList">Lista de Precios</Label>
        <select
          id="priceList"
          value={formData.fk_id_lista_precio || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              fk_id_lista_precio: e.target.value ? Number.parseInt(e.target.value) : null,
            }))
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Sin lista de precios asignada</option>
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="activo"
          checked={formData.activo}
          onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, activo: checked }))}
        />
        <Label htmlFor="activo" className="text-sm font-medium">Producto activo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-black hover:bg-gray-800 text-white"
          disabled={saving}
        >
          {saving ? "Guardando..." : (product ? "Actualizar" : "Crear")} Producto
        </Button>
      </div>
    </form>
  )
}

function PurchaseConditionForm({ 
  condition, 
  providers, 
  onSave, 
  onCancel,
  saving = false
}: { 
  condition: CondicionCompra | null
  providers: Proveedor[]
  onSave: (data: Partial<CondicionCompra>) => Promise<void>
  onCancel: () => void
  saving?: boolean
}) {
  const [formData, setFormData] = useState({
    nombre: condition?.nombre || "",
    tipo: condition?.tipo || "Cuenta Corriente",
    descripcion: condition?.descripcion || "",
    descuento: condition?.descuento || 0,
    recargo: condition?.recargo || 0,
    dias_pago: condition?.dias_pago || 0,
    activo: condition?.activo ?? true,
    fk_id_proveedor: condition?.fk_id_proveedor || null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que la descripción no esté vacía
    if (!formData.descripcion.trim()) {
      alert('La descripción es obligatoria')
      return
    }
    
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nombre">Nombre de la Condición</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Efectivo 15% descuento"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tipo">Tipo de Condición</Label>
        <select
          id="tipo"
          value={formData.tipo}
          onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value }))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="Cuenta Corriente">Cuenta Corriente</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Cheques">Cheques</option>
          <option value="Transferencia">Transferencia</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="provider">Proveedor (opcional)</Label>
        <select
          id="provider"
          value={formData.fk_id_proveedor || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              fk_id_proveedor: e.target.value ? Number.parseInt(e.target.value) : null,
            }))
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los proveedores</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="descuento">Descuento (%)</Label>
          <Input
            id="descuento"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.descuento}
            onChange={(e) => setFormData((prev) => ({ ...prev, descuento: Number.parseFloat(e.target.value) || 0 }))}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="recargo">Recargo (%)</Label>
          <Input
            id="recargo"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.recargo}
            onChange={(e) => setFormData((prev) => ({ ...prev, recargo: Number.parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dias_pago">Días de Pago</Label>
        <Input
          id="dias_pago"
          type="number"
          min="0"
          value={formData.dias_pago}
          onChange={(e) => setFormData((prev) => ({ ...prev, dias_pago: Number.parseInt(e.target.value) || 0 }))}
          placeholder="0 = inmediato"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Descripción detallada de la condición..."
          rows={3}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="activo"
          checked={formData.activo}
          onCheckedChange={(checked: boolean) => setFormData((prev) => ({ ...prev, activo: checked }))}
        />
        <Label htmlFor="activo">Condición activa</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-black hover:bg-gray-800 text-white"
          disabled={saving}
        >
          {saving ? "Guardando..." : (condition ? "Actualizar" : "Crear")} Condición
        </Button>
      </div>
    </form>
  )
}
