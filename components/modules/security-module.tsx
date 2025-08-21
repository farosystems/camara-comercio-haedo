"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Users, Eye, EyeOff, Save, RefreshCw } from "lucide-react"
import { Usuario } from "@/lib/supabase"
import { Modulo, getUsuarios, getModulos, getPermisosUsuario, actualizarPermisosUsuario } from "@/lib/supabase-admin"

interface PermisoModulo {
  moduloId: number
  moduloNombre: string
  puedeVer: boolean
}

export function SecurityModule() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [permisosUsuario, setPermisosUsuario] = useState<PermisoModulo[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (usuarioSeleccionado) {
      cargarPermisosUsuario(usuarioSeleccionado.id)
    }
  }, [usuarioSeleccionado])

  async function cargarDatos() {
    try {
      setLoading(true)
      const [usuariosData, modulosData] = await Promise.all([
        getUsuarios(),
        getModulos()
      ])
      setUsuarios(usuariosData)
      setModulos(modulosData)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  async function cargarPermisosUsuario(usuarioId: number) {
    try {
      const permisosData = await getPermisosUsuario(usuarioId)
      
      // Crear array de permisos para todos los módulos
      const permisosCompletos = modulos.map((modulo: Modulo) => {
        const permisoExistente = permisosData.find((p: any) => p.fk_id_modulo === modulo.id)
        return {
          moduloId: modulo.id,
          moduloNombre: modulo.nombre,
          puedeVer: permisoExistente?.puede_ver || false
        }
      })
      
      setPermisosUsuario(permisosCompletos)
    } catch (err) {
      console.error('Error cargando permisos:', err)
      setError('Error al cargar los permisos del usuario')
    }
  }

  function handleUsuarioChange(usuarioId: string) {
    const usuario = usuarios.find((u: Usuario) => u.id.toString() === usuarioId)
    setUsuarioSeleccionado(usuario || null)
  }

  function handlePermisoChange(moduloId: number, puedeVer: boolean) {
    setPermisosUsuario((prev: PermisoModulo[]) => 
      prev.map((permiso: PermisoModulo) => 
        permiso.moduloId === moduloId 
          ? { ...permiso, puedeVer } 
          : permiso
      )
    )
  }

  async function guardarPermisos() {
    if (!usuarioSeleccionado) return

    try {
      setGuardando(true)
      const permisosData = permisosUsuario.map((p: PermisoModulo) => ({
        moduloId: p.moduloId,
        puedeVer: p.puedeVer
      }))

      await actualizarPermisosUsuario(usuarioSeleccionado.id, permisosData)
      setError(null)
    } catch (err) {
      console.error('Error guardando permisos:', err)
      setError('Error al guardar los permisos')
    } finally {
      setGuardando(false)
    }
  }

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Nunca'
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos de seguridad...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seguridad por Usuario</h2>
          <p className="text-muted-foreground">Gestión de permisos y acceso a módulos por usuario</p>
        </div>
        <Button 
          onClick={cargarDatos} 
          variant="outline"
          className="bg-black hover:bg-gray-800 text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Selección de Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleccionar Usuario
            </CardTitle>
            <CardDescription>Elige el usuario para gestionar sus permisos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="usuario">Usuario</Label>
                <Select onValueChange={handleUsuarioChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                                         {usuarios.map((usuario: Usuario) => (
                       <SelectItem key={usuario.id} value={usuario.id.toString()}>
                         <div className="flex items-center gap-2">
                           <span>{usuario.nombre}</span>
                           <Badge variant={usuario.rol === "admin" ? "default" : "secondary"} className={usuario.rol === "admin" ? "bg-black text-white" : usuario.rol === "supervisor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}>
                             {usuario.rol === "admin" ? "Administrador" : usuario.rol === "supervisor" ? "Supervisor" : "Socio"}
                           </Badge>
                         </div>
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>

              {usuarioSeleccionado && (
                <div className="space-y-2">
                  <h4 className="font-medium">Información del Usuario</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Email:</strong> {usuarioSeleccionado.email}</p>
                    <p><strong>Teléfono:</strong> {usuarioSeleccionado.telefono || 'No especificado'}</p>
                    <p><strong>Estado:</strong> 
                      <Badge variant={usuarioSeleccionado.status === "Activo" ? "default" : "secondary"} className={usuarioSeleccionado.status === "Activo" ? "bg-green-100 text-green-800 ml-2" : "bg-red-100 text-red-800 ml-2"}>
                        {usuarioSeleccionado.status}
                      </Badge>
                    </p>
                    <p><strong>Último acceso:</strong> {formatearFecha(usuarioSeleccionado.ultimo_acceso)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permisos de Módulos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de Módulos
            </CardTitle>
            <CardDescription>
              {usuarioSeleccionado 
                ? `Configurar permisos para ${usuarioSeleccionado.nombre}`
                : "Selecciona un usuario para gestionar sus permisos"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!usuarioSeleccionado ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Selecciona un usuario para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                                     {permisosUsuario.map((permiso: PermisoModulo) => (
                     <div key={permiso.moduloId} className="flex items-center justify-between p-3 border rounded-lg">
                       <div className="flex items-center gap-3">
                         <Checkbox
                           id={`modulo-${permiso.moduloId}`}
                           checked={permiso.puedeVer}
                           onCheckedChange={(checked: boolean) => handlePermisoChange(permiso.moduloId, checked)}
                         />
                         <Label htmlFor={`modulo-${permiso.moduloId}`} className="font-medium">
                           {permiso.moduloNombre}
                         </Label>
                       </div>
                       <div className="flex items-center gap-2">
                         {permiso.puedeVer ? (
                           <Eye className="h-4 w-4 text-green-600" />
                         ) : (
                           <EyeOff className="h-4 w-4 text-gray-400" />
                         )}
                       </div>
                     </div>
                   ))}
                </div>

                <Button 
                  onClick={guardarPermisos} 
                  disabled={guardando}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Guardar Permisos'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>Lista completa de usuarios y sus roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Rol</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Último Acceso</TableHead>
                <TableHead className="font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                             {usuarios.map((usuario: Usuario) => (
                 <TableRow key={usuario.id}>
                   <TableCell className="font-medium">{usuario.nombre}</TableCell>
                   <TableCell>{usuario.email}</TableCell>
                   <TableCell>
                     <Badge variant={usuario.rol === "admin" ? "default" : "secondary"} className={usuario.rol === "admin" ? "bg-black text-white" : usuario.rol === "supervisor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}>
                       {usuario.rol === "admin" ? "Administrador" : usuario.rol === "supervisor" ? "Supervisor" : "Socio"}
                     </Badge>
                   </TableCell>
                   <TableCell>
                     <Badge variant={usuario.status === "Activo" ? "default" : "secondary"} className={usuario.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                       {usuario.status}
                     </Badge>
                   </TableCell>
                   <TableCell>{formatearFecha(usuario.ultimo_acceso)}</TableCell>
                   <TableCell>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setUsuarioSeleccionado(usuario)}
                       className="text-gray-600 hover:text-gray-800"
                     >
                       <Shield className="mr-2 h-4 w-4" />
                       Gestionar
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
