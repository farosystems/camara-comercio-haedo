"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Shield, Settings, Users, Key, Save, X } from "lucide-react"
import { Usuario } from "@/lib/supabase"
import { getUsuarios, getEstadisticasUsuarios, crearUsuario, actualizarUsuario } from "@/lib/supabase-admin"

export function AdminModule() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    administradores: 0,
    supervisores: 0,
    socios: 0,
    activos: 0,
    pruebaGratis: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para popups
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Estados para formularios
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'socio' as 'admin' | 'supervisor' | 'socio',
    status: 'Activo' as 'Activo' | 'Inactivo' | 'Bloqueado',
    prueba_gratis: false,
    password_hash: '',
    clerk_user_id: null,
    ultimo_acceso: null
  })
  
  const [editUser, setEditUser] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'socio' as 'admin' | 'supervisor' | 'socio',
    status: 'Activo' as 'Activo' | 'Inactivo' | 'Bloqueado',
    prueba_gratis: false
  })

  const [systemConfig] = useState({
    organizationName: "AgrupaciónSan Martín",
    cuit: "20-12345678-9",
    address: "Av. San Martín 1234, CABA",
    phone: "+54 11 4567-8901",
    email: "info@agrupacion.com",
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires",
  })

  // Cargar datos de usuarios desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [usuariosData, estadisticasData] = await Promise.all([
          getUsuarios(),
          getEstadisticasUsuarios()
        ])
        setUsers(usuariosData)
        setEstadisticas(estadisticasData)
      } catch (err) {
        console.error('Error cargando datos:', err)
        setError('Error al cargar los datos de usuarios')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Función para formatear fecha
  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Función para abrir diálogo de edición
  const handleEditUser = (user: Usuario) => {
    setEditingUser(user)
    setEditUser({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      rol: user.rol,
      status: user.status,
      prueba_gratis: user.prueba_gratis
    })
    setIsEditUserDialogOpen(true)
  }

  // Función para crear nuevo usuario
  const handleCreateUser = async () => {
    try {
      setSaving(true)
      await crearUsuario(newUser)
      
      // Recargar datos
      const [usuariosData, estadisticasData] = await Promise.all([
        getUsuarios(),
        getEstadisticasUsuarios()
      ])
      setUsers(usuariosData)
      setEstadisticas(estadisticasData)
      
      // Limpiar formulario y cerrar diálogo
      setNewUser({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'socio',
        status: 'Activo',
        prueba_gratis: false,
        password_hash: '',
        clerk_user_id: null,
        ultimo_acceso: null
      })
      setIsNewUserDialogOpen(false)
      setError(null)
    } catch (err) {
      console.error('Error creando usuario:', err)
      setError('Error al crear el usuario')
    } finally {
      setSaving(false)
    }
  }

  // Función para actualizar usuario
  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      setSaving(true)
      await actualizarUsuario(editingUser.id, editUser)
      
      // Recargar datos
      const [usuariosData, estadisticasData] = await Promise.all([
        getUsuarios(),
        getEstadisticasUsuarios()
      ])
      setUsers(usuariosData)
      setEstadisticas(estadisticasData)
      
      // Cerrar diálogo
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
      setError(null)
    } catch (err) {
      console.error('Error actualizando usuario:', err)
      setError('Error al actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  // Función para limpiar formulario de nuevo usuario
  const resetNewUserForm = () => {
    setNewUser({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'socio',
      status: 'Activo',
      prueba_gratis: false,
      password_hash: '',
      clerk_user_id: null,
      ultimo_acceso: null
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administración</h2>
          <p className="text-muted-foreground">Configuración del sistema, usuarios y mantenimiento</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Usuarios y Roles</TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px] bg-white border-0 shadow-2xl rounded-xl text-black">
                <div className="bg-white">
                  <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                      Completa los datos del nuevo usuario del sistema
                    </DialogDescription>
                  </DialogHeader>
                                    <div className="grid gap-6 py-2">
                    <div className="grid gap-3">
                      <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">Nombre completo</Label>
                      <Input
                        id="nombre"
                        value={newUser.nombre}
                        onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                        placeholder="Ingresa el nombre completo"
                        className="h-11 border-gray-200 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="usuario@ejemplo.com"
                        className="h-11 border-gray-200 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={newUser.telefono}
                        onChange={(e) => setNewUser({...newUser, telefono: e.target.value})}
                        placeholder="+54 11 1234-5678"
                        className="h-11 border-gray-200 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="rol" className="text-sm font-medium text-gray-700">Rol</Label>
                        <Select value={newUser.rol} onValueChange={(value: 'admin' | 'supervisor' | 'socio') => setNewUser({...newUser, rol: value})}>
                          <SelectTrigger className="h-11 border-gray-200 focus:border-black focus:ring-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="socio">Socio</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">Estado</Label>
                        <Select value={newUser.status} onValueChange={(value: 'Activo' | 'Inactivo' | 'Bloqueado') => setNewUser({...newUser, status: value})}>
                          <SelectTrigger className="h-11 border-gray-200 focus:border-black focus:ring-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Inactivo">Inactivo</SelectItem>
                            <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="prueba_gratis"
                        checked={newUser.prueba_gratis}
                        onChange={(e) => setNewUser({...newUser, prueba_gratis: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <Label htmlFor="prueba_gratis" className="text-sm font-medium text-gray-700">Prueba gratis</Label>
                    </div>
                  </div>
                                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsNewUserDialogOpen(false)}
                      className="h-11 px-6 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateUser} 
                      disabled={saving} 
                      className="h-11 px-6 bg-black hover:bg-gray-800 text-white shadow-sm"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Guardando...' : 'Crear Usuario'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>Gestión de usuarios y permisos de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay usuarios registrados</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nombre</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Teléfono</TableHead>
                      <TableHead className="font-semibold">Rol</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Prueba Gratis</TableHead>
                      <TableHead className="font-semibold">Último Acceso</TableHead>
                      <TableHead className="font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: Usuario) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nombre}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.telefono || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.rol === "admin" ? "default" : "secondary"} className={user.rol === "admin" ? "bg-black text-white" : user.rol === "supervisor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}>
                            <Shield className="mr-1 h-3 w-3" />
                            {user.rol === "admin" ? "Administrador" : user.rol === "supervisor" ? "Supervisor" : "Socio"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Activo" ? "default" : "secondary"} className={user.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.prueba_gratis ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}>
                            {user.prueba_gratis ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatearFecha(user.ultimo_acceso)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Roles y Permisos</CardTitle>
                <CardDescription>Configuración de niveles de acceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">Administrador (admin)</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Acceso completo al sistema</li>
                      <li>• Gestión de usuarios y configuración</li>
                      <li>• Administración de proveedores</li>
                      <li>• Facturación y cuentas corrientes</li>
                      <li>• Gestión de permisos y módulos</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Supervisor (supervisor)</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Gestión de socios y pedidos</li>
                      <li>• Ver reportes y estadísticas</li>
                      <li>• Administración de listas de precios</li>
                      <li>• Gestión de facturación</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <h4 className="font-medium">Socio (socio)</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ver listas de precios</li>
                      <li>• Realizar pedidos</li>
                      <li>• Ver historial de pedidos</li>
                      <li>• Consultar cuenta corriente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Usuarios</CardTitle>
                <CardDescription>Actividad y uso del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de usuarios:</span>
                    <span className="font-medium">{estadisticas.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Administradores:</span>
                    <span className="font-medium">{estadisticas.administradores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supervisores:</span>
                    <span className="font-medium">{estadisticas.supervisores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Socios:</span>
                    <span className="font-medium">{estadisticas.socios}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuarios activos:</span>
                    <span className="font-medium">{estadisticas.activos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En prueba gratis:</span>
                    <span className="font-medium">{estadisticas.pruebaGratis}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Datos básicos de la agrupación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Nombre de la Agrupación</Label>
                  <Input id="orgName" defaultValue={systemConfig.organizationName} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input id="cuit" defaultValue={systemConfig.cuit} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" defaultValue={systemConfig.address} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" defaultValue={systemConfig.phone} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={systemConfig.email} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Facturación</CardTitle>
              <CardDescription>Parámetros para la generación de facturas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="invoicePrefix">Prefijo de Facturas</Label>
                  <Input id="invoicePrefix" defaultValue="FAC-" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nextNumber">Próximo Número</Label>
                  <Input id="nextNumber" type="number" defaultValue="004" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentTerms">Plazo de Pago (días)</Label>
                  <Input id="paymentTerms" type="number" defaultValue="30" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxRate">Tasa de IVA (%)</Label>
                  <Input id="taxRate" type="number" defaultValue="21" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Actualizar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Popup de Edición de Usuario */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white border-0 shadow-2xl rounded-xl text-black">
          <div className="bg-white">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900">Editar Usuario</DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Modifica los datos del usuario seleccionado
              </DialogDescription>
            </DialogHeader>
                      <div className="grid gap-6 py-2">
              <div className="grid gap-3">
                <Label htmlFor="edit-nombre" className="text-sm font-medium text-gray-700">Nombre completo</Label>
                <Input
                  id="edit-nombre"
                  value={editUser.nombre}
                  onChange={(e) => setEditUser({...editUser, nombre: e.target.value})}
                  placeholder="Ingresa el nombre completo"
                  className="h-11 border-gray-200 focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  placeholder="usuario@ejemplo.com"
                  className="h-11 border-gray-200 focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-telefono" className="text-sm font-medium text-gray-700">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  value={editUser.telefono}
                  onChange={(e) => setEditUser({...editUser, telefono: e.target.value})}
                  placeholder="+54 11 1234-5678"
                  className="h-11 border-gray-200 focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="edit-rol" className="text-sm font-medium text-gray-700">Rol</Label>
                  <Select value={editUser.rol} onValueChange={(value: 'admin' | 'supervisor' | 'socio') => setEditUser({...editUser, rol: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-black focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="socio">Socio</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">Estado</Label>
                  <Select value={editUser.status} onValueChange={(value: 'Activo' | 'Inactivo' | 'Bloqueado') => setEditUser({...editUser, status: value})}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-black focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="edit-prueba_gratis"
                  checked={editUser.prueba_gratis}
                  onChange={(e) => setEditUser({...editUser, prueba_gratis: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <Label htmlFor="edit-prueba_gratis" className="text-sm font-medium text-gray-700">Prueba gratis</Label>
              </div>
            </div>
                      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setIsEditUserDialogOpen(false)}
                className="h-11 px-6 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUser} 
                disabled={saving} 
                className="h-11 px-6 bg-black hover:bg-gray-800 text-white shadow-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Actualizar Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
