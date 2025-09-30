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
import { Plus, Edit, Trash2, Eye, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Socio, getSocios } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

export function MembersModule() {
  const [members, setMembers] = useState<Socio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Socio | null>(null)
  const [activeTab, setActiveTab] = useState("basica")
  const [formData, setFormData] = useState({
    razon_social: "",
    cuit: "",
    tipo_sociedad: "",
    fecha_constitucion: "",
    email: "",
    telefono: "",
    web: "",
    direccion_fiscal: "",
    condicion_fiscal: "",
    criterio_facturacion: "",
    datos_bancarios: "",
    representante_legal: "",
    dni_representante: "",
    cargo_representante: "",
    actividad_economica: "",
    registro_mercantil: "",
    status: "Activo",
    fk_id_usuario: null as number | null,
    password: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  // Estados para la funcionalidad de creación automática de usuario
  const [autoCreateUser, setAutoCreateUser] = useState(true)
  const [userPassword, setUserPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const { toast } = useToast()

  // Función para cargar datos de socios desde Supabase
  const cargarDatos = async () => {
    try {
      setLoading(true)
      const sociosData = await getSocios()
      setMembers(sociosData)
    } catch (err) {
      console.error('Error cargando socios:', err)
      setError('Error al cargar los datos de socios')
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar usuarios con rol "socio"
  const cargarUsuarios = async () => {
    try {
      console.log('Cargando usuarios con rol socio...')
      
      // Primero, verificar qué usuarios existen
      const { data: allUsers, error: allError } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol')
        .order('nombre')

      if (allError) {
        console.error('Error cargando todos los usuarios:', allError)
        return
      }

      console.log('Todos los usuarios:', allUsers)

      // Filtrar usuarios con rol "socio"
      const usuariosSocio = allUsers?.filter((user: Usuario) => user.rol === 'socio') || []
      
      console.log('Usuarios con rol socio:', usuariosSocio)
      
      setUsuarios(usuariosSocio)
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    }
  }

  // Cargar datos de socios desde Supabase
  useEffect(() => {
    cargarDatos()
    cargarUsuarios()
  }, [])

  const resetForm = () => {
    setFormData({
      razon_social: "",
      cuit: "",
      tipo_sociedad: "",
      fecha_constitucion: "",
      email: "",
      telefono: "",
      web: "",
      direccion_fiscal: "",
      condicion_fiscal: "",
      criterio_facturacion: "",
      datos_bancarios: "",
      representante_legal: "",
      dni_representante: "",
      cargo_representante: "",
      actividad_economica: "",
      registro_mercantil: "",
      status: "Activo",
      fk_id_usuario: null,
      password: ""
    })
    setErrors({})
    setActiveTab("basica")
    setAutoCreateUser(true)
    setUserPassword('')
  }

  // Función para crear usuario en Clerk
  const createUserInClerk = async (socioData: any) => {
    try {
      const response = await fetch('/api/clerk/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: socioData.email,
          password: formData.password,
          firstName: socioData.representante_legal.split(' ')[0] || socioData.representante_legal,
          lastName: socioData.representante_legal.split(' ').slice(1).join(' ') || '',
          representanteLegal: socioData.representante_legal,
          telefono: socioData.telefono
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error creando usuario')
      }
      
      return result.usuarioId
    } catch (error) {
      console.error('Error creando usuario en Clerk:', error)
      throw error
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    // Validar pestaña Básica
    if (!formData.razon_social.trim()) {
      newErrors.razon_social = "La razón social es obligatoria"
    }
    if (!formData.cuit.trim()) {
      newErrors.cuit = "El CUIT es obligatorio"
    }
    if (!formData.tipo_sociedad) {
      newErrors.tipo_sociedad = "El tipo de sociedad es obligatorio"
    }

    // Validar pestaña Contacto
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio"
    }
    if (!formData.direccion_fiscal.trim()) {
      newErrors.direccion_fiscal = "La dirección fiscal es obligatoria"
    }

    // Validar pestaña Fiscal
    if (!formData.condicion_fiscal) {
      newErrors.condicion_fiscal = "La condición fiscal es obligatoria"
    }
    if (!formData.criterio_facturacion) {
      newErrors.criterio_facturacion = "El criterio de facturación es obligatorio"
    }

    // Validar pestaña Representante
    if (!formData.representante_legal.trim()) {
      newErrors.representante_legal = "El representante legal es obligatorio"
    }
    if (!formData.dni_representante.trim()) {
      newErrors.dni_representante = "El DNI del representante es obligatorio"
    }
    if (!formData.cargo_representante.trim()) {
      newErrors.cargo_representante = "El cargo del representante es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Determinar en qué pestaña está el primer error
      const errorFields = Object.keys(errors)
      if (errorFields.includes('razon_social') || errorFields.includes('cuit') || errorFields.includes('tipo_sociedad')) {
        setActiveTab("basica")
      } else if (errorFields.includes('email') || errorFields.includes('telefono') || errorFields.includes('direccion_fiscal')) {
        setActiveTab("contacto")
      } else if (errorFields.includes('condicion_fiscal') || errorFields.includes('criterio_facturacion')) {
        setActiveTab("fiscal")
      } else if (errorFields.includes('representante_legal') || errorFields.includes('dni_representante') || errorFields.includes('cargo_representante')) {
        setActiveTab("representante")
      }
      return
    }

    // Validar contraseña si se va a crear usuario automáticamente
          if (autoCreateUser) {
        if (!formData.password) {
          setErrors(prev => ({ ...prev, password: "La contraseña es obligatoria para crear el usuario" }))
          setActiveTab("contacto")
          return
        }
        if (formData.password.length < 8) {
          setErrors(prev => ({ ...prev, password: "La contraseña debe tener al menos 8 caracteres" }))
          setActiveTab("contacto")
          return
        }
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
          setErrors(prev => ({ ...prev, password: "La contraseña debe contener al menos una letra y un número" }))
          setActiveTab("contacto")
          return
        }
      }

    try {
      setCreatingUser(true)
      let usuarioId = formData.fk_id_usuario

      // Si está marcado crear usuario automáticamente
      if (autoCreateUser) {
        try {
          usuarioId = await createUserInClerk(formData)
          toast({
            title: "Usuario creado",
            description: "Se creó el usuario en Clerk y base de datos exitosamente"
          })
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          })
          return
        }
      }

      // Crear el socio en Supabase
      const { data, error } = await supabase
        .from('socios')
        .insert([{
          razon_social: formData.razon_social,
          cuit: formData.cuit,
          tipo_sociedad: formData.tipo_sociedad,
          fecha_constitucion: formData.fecha_constitucion || null,
          email: formData.email,
          telefono: formData.telefono,
          web: formData.web || null,
          direccion_fiscal: formData.direccion_fiscal,
          condicion_fiscal: formData.condicion_fiscal,
          criterio_facturacion: formData.criterio_facturacion,
          datos_bancarios: formData.datos_bancarios || null,
          representante_legal: formData.representante_legal,
          dni_representante: formData.dni_representante,
          cargo_representante: formData.cargo_representante,
          actividad_economica: formData.actividad_economica || null,
          registro_mercantil: formData.registro_mercantil || null,
          status: formData.status,
          fk_id_usuario: usuarioId
        }])
        .select()

      if (error) {
        console.error('Error al crear socio:', error)
        toast({
          title: "Error",
          description: "Error al crear el socio: " + error.message,
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Socio creado",
        description: autoCreateUser 
          ? "Socio y usuario creados exitosamente" 
          : "Socio creado exitosamente"
      })
      
      // Recargar los datos
      await cargarDatos()
      await cargarUsuarios()
      
      // Cerrar el diálogo y resetear el formulario
      setIsDialogOpen(false)
      resetForm()

    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "Error inesperado al crear el socio",
        variant: "destructive"
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'fk_id_usuario' ? (value ? parseInt(value) : null) : value 
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleViewMember = (member: Socio) => {
    setSelectedMember(member)
    setIsViewDialogOpen(true)
  }

  const handleEditMember = (member: Socio) => {
    setSelectedMember(member)
    setFormData({
      razon_social: member.razon_social,
      cuit: member.cuit,
      tipo_sociedad: member.tipo_sociedad,
      fecha_constitucion: member.fecha_constitucion || "",
      email: member.email,
      telefono: member.telefono,
      web: member.web || "",
      direccion_fiscal: member.direccion_fiscal,
      condicion_fiscal: member.condicion_fiscal,
      criterio_facturacion: member.criterio_facturacion,
      datos_bancarios: member.datos_bancarios || "",
      representante_legal: member.representante_legal,
      dni_representante: member.dni_representante,
      cargo_representante: member.cargo_representante,
      actividad_economica: member.actividad_economica || "",
      registro_mercantil: member.registro_mercantil || "",
      status: member.status,
      fk_id_usuario: null, // TODO: Agregar fk_id_usuario al tipo Socio
      password: "" // Campo para edición (no se usa en edición)
    })
    setActiveTab("basica")
    setAutoCreateUser(false) // Deshabilitar creación automática en edición
    setIsEditDialogOpen(true)
  }

  const handleDeleteMember = (member: Socio) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedMember) return

    try {
      const { error } = await supabase
        .from('socios')
        .delete()
        .eq('id', selectedMember.id)

      if (error) {
        console.error('Error al eliminar socio:', error)
        alert('Error al eliminar el socio: ' + error.message)
        return
      }

      console.log('Socio eliminado exitosamente')
      
      // Recargar los datos
      await cargarDatos()
      
      // Cerrar el diálogo
      setIsDeleteDialogOpen(false)
      setSelectedMember(null)
    } catch (err) {
      console.error('Error al eliminar socio:', err)
      alert('Error inesperado al eliminar el socio')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Socios</h2>
          <p className="text-muted-foreground">Administra los socios de la agrupación</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Socio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] bg-white border-0 shadow-2xl rounded-xl text-black">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Socio</DialogTitle>
              <DialogDescription>Completa la información del socio</DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="basica" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">
                  Básica
                  {(errors.razon_social || errors.cuit || errors.tipo_sociedad) && (
                    <span className="ml-1 text-red-500">•</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contacto" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">
                  Contacto
                  {(errors.email || errors.telefono || errors.direccion_fiscal) && (
                    <span className="ml-1 text-red-500">•</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">
                  Fiscal
                  {(errors.condicion_fiscal || errors.criterio_facturacion) && (
                    <span className="ml-1 text-red-500">•</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="representante" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">
                  Representante
                  {(errors.representante_legal || errors.dni_representante || errors.cargo_representante) && (
                    <span className="ml-1 text-red-500">•</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="adicional" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Adicional</TabsTrigger>
              </TabsList>

              <TabsContent value="basica" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input 
                      id="razon_social" 
                      placeholder="Razón social de la empresa" 
                      value={formData.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      className={`${errors.razon_social ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.razon_social && (
                      <p className="text-red-500 text-xs">{errors.razon_social}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input 
                      id="cuit" 
                      placeholder="20-12345678-9" 
                      value={formData.cuit}
                      onChange={(e) => handleInputChange('cuit', e.target.value)}
                      className={`${errors.cuit ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.cuit && (
                      <p className="text-red-500 text-xs">{errors.cuit}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tipo_sociedad">Tipo de Sociedad *</Label>
                    <select 
                      id="tipo_sociedad" 
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.tipo_sociedad ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                      value={formData.tipo_sociedad}
                      onChange={(e) => handleInputChange('tipo_sociedad', e.target.value)}
                    >
                      <option value="" className="text-gray-300">Seleccionar tipo...</option>
                      <option value="S.R.L.">S.R.L.</option>
                      <option value="S.A.">S.A.</option>
                      <option value="Monotributista">Monotributista</option>
                      <option value="Autónomo">Autónomo</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {errors.tipo_sociedad && (
                      <p className="text-red-500 text-xs">{errors.tipo_sociedad}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_constitucion">Fecha de Constitución</Label>
                    <Input 
                      id="fecha_constitucion" 
                      type="date" 
                      value={formData.fecha_constitucion}
                      onChange={(e) => handleInputChange('fecha_constitucion', e.target.value)}
                      className="placeholder:text-gray-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fk_id_usuario">Usuario Asociado</Label>
                    <select 
                      id="fk_id_usuario" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-gray-300"
                      value={formData.fk_id_usuario || ""}
                      onChange={(e) => handleInputChange('fk_id_usuario', e.target.value)}
                    >
                      <option value="" className="text-gray-300">
                        {usuarios.length === 0 ? "No hay usuarios con rol socio" : "Seleccionar usuario..."}
                      </option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contacto" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="socio@email.com" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`${errors.email ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">{errors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input 
                      id="telefono" 
                      placeholder="+54 11 1234-5678" 
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      className={`${errors.telefono ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.telefono && (
                      <p className="text-red-500 text-xs">{errors.telefono}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="web">Sitio Web</Label>
                    <Input 
                      id="web" 
                      placeholder="https://www.ejemplo.com" 
                      value={formData.web}
                      onChange={(e) => handleInputChange('web', e.target.value)}
                      className="placeholder:text-gray-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="direccion_fiscal">Dirección Fiscal *</Label>
                    <Input 
                      id="direccion_fiscal" 
                      placeholder="Dirección fiscal completa" 
                      value={formData.direccion_fiscal}
                      onChange={(e) => handleInputChange('direccion_fiscal', e.target.value)}
                      className={`${errors.direccion_fiscal ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.direccion_fiscal && (
                      <p className="text-red-500 text-xs">{errors.direccion_fiscal}</p>
                    )}
                  </div>
                </div>

                {/* Sección de creación automática de usuario */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox 
                      id="auto-create-user"
                      checked={autoCreateUser}
                      onCheckedChange={(checked) => setAutoCreateUser(checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="auto-create-user" className="text-sm font-medium text-blue-900">
                      Crear usuario automáticamente en el sistema
                    </Label>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Al marcar esta opción, se creará automáticamente un usuario en Clerk con acceso al sistema.
                  </p>

                  {/* Campo de contraseña (solo si está marcado crear usuario) */}
                  {autoCreateUser && (
                    <div className="grid gap-2">
                      <Label htmlFor="password" className="text-sm font-medium text-blue-900">
                        Contraseña para el usuario <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Contraseña del usuario (mínimo 8 caracteres)"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`${errors.password ? "border-red-500" : "border-blue-300"} placeholder:text-blue-400`}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password}</p>
                      )}
                      <p className="text-xs text-blue-600">
                        Requisitos: Mínimo 8 caracteres, al menos una letra y un número. El usuario podrá cambiarla después.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="fiscal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="condicion_fiscal">Condición Fiscal *</Label>
                    <select 
                      id="condicion_fiscal" 
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.condicion_fiscal ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                      value={formData.condicion_fiscal}
                      onChange={(e) => handleInputChange('condicion_fiscal', e.target.value)}
                    >
                      <option value="" className="text-gray-300">Seleccionar condición...</option>
                      <option value="Responsable Inscripto">Responsable Inscripto</option>
                      <option value="Monotributista">Monotributista</option>
                      <option value="Exento">Exento</option>
                      <option value="Consumidor Final">Consumidor Final</option>
                    </select>
                    {errors.condicion_fiscal && (
                      <p className="text-red-500 text-xs">{errors.condicion_fiscal}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="criterio_facturacion">Criterio de Facturación *</Label>
                    <select 
                      id="criterio_facturacion" 
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.criterio_facturacion ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                      value={formData.criterio_facturacion}
                      onChange={(e) => handleInputChange('criterio_facturacion', e.target.value)}
                    >
                      <option value="" className="text-gray-300">Seleccionar criterio...</option>
                      <option value="Anticipado">Anticipado</option>
                      <option value="Por entrega">Por entrega</option>
                      <option value="30 días">30 días</option>
                      <option value="60 días">60 días</option>
                      <option value="Contado">Contado</option>
                    </select>
                    {errors.criterio_facturacion && (
                      <p className="text-red-500 text-xs">{errors.criterio_facturacion}</p>
                    )}
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="datos_bancarios">Datos Bancarios</Label>
                    <textarea 
                      id="datos_bancarios" 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-gray-300" 
                      placeholder="Información bancaria (cuenta corriente, CBU, etc.)"
                      value={formData.datos_bancarios}
                      onChange={(e) => handleInputChange('datos_bancarios', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="representante" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="representante_legal">Representante Legal *</Label>
                    <Input 
                      id="representante_legal" 
                      placeholder="Nombre completo del representante" 
                      value={formData.representante_legal}
                      onChange={(e) => handleInputChange('representante_legal', e.target.value)}
                      className={`${errors.representante_legal ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.representante_legal && (
                      <p className="text-red-500 text-xs">{errors.representante_legal}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dni_representante">DNI Representante *</Label>
                    <Input 
                      id="dni_representante" 
                      placeholder="12345678" 
                      value={formData.dni_representante}
                      onChange={(e) => handleInputChange('dni_representante', e.target.value)}
                      className={`${errors.dni_representante ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.dni_representante && (
                      <p className="text-red-500 text-xs">{errors.dni_representante}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cargo_representante">Cargo del Representante *</Label>
                    <Input 
                      id="cargo_representante" 
                      placeholder="Ej: Presidente, Gerente, etc." 
                      value={formData.cargo_representante}
                      onChange={(e) => handleInputChange('cargo_representante', e.target.value)}
                      className={`${errors.cargo_representante ? "border-red-500" : ""} placeholder:text-gray-300`}
                    />
                    {errors.cargo_representante && (
                      <p className="text-red-500 text-xs">{errors.cargo_representante}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="actividad_economica">Actividad Económica</Label>
                    <Input 
                      id="actividad_economica" 
                      placeholder="Descripción de la actividad principal" 
                      value={formData.actividad_economica}
                      onChange={(e) => handleInputChange('actividad_economica', e.target.value)}
                      className="placeholder:text-gray-300"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="adicional" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registro_mercantil">Registro Mercantil</Label>
                    <Input 
                      id="registro_mercantil" 
                      placeholder="Número de registro mercantil" 
                      value={formData.registro_mercantil}
                      onChange={(e) => handleInputChange('registro_mercantil', e.target.value)}
                      className="placeholder:text-gray-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado *</Label>
                    <select 
                      id="status" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                      <option value="Suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleSubmit}
                disabled={creatingUser}
              >
                {creatingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {autoCreateUser ? 'Creando socio y usuario...' : 'Creando socio...'}
                  </>
                ) : (
                  autoCreateUser ? 'Crear Socio y Usuario' : 'Guardar Socio'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Socios</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Socios Activos</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{members.filter(m => m.status === 'Activo').length}</div>
            <p className="text-xs text-muted-foreground">Con estado activo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Socios Inactivos</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{members.filter(m => m.status !== 'Activo').length}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Socios Registrados</CardTitle>
          <CardDescription>Lista completa de todos los socios de la agrupación</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando socios...</p>
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
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay socios registrados</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Información General</TabsTrigger>
                <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Datos Fiscales</TabsTrigger>
                <TabsTrigger value="contacto" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm">Información de Contacto</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead>Tipo Sociedad</TableHead>
                      <TableHead>Representante Legal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Alta</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.razon_social}</TableCell>
                        <TableCell>{member.cuit}</TableCell>
                        <TableCell>{member.tipo_sociedad}</TableCell>
                        <TableCell>{member.representante_legal}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === "Activo" ? "default" : "secondary"} className={member.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.fecha_alta}</TableCell>
                                                 <TableCell>
                           <div className="flex gap-2">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-gray-600 hover:text-gray-800"
                               onClick={() => handleViewMember(member)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-gray-600 hover:text-gray-800"
                               onClick={() => handleEditMember(member)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                                                            <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="text-gray-600 hover:text-gray-800"
                                 onClick={() => handleDeleteMember(member)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="fiscal" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>Condición Fiscal</TableHead>
                      <TableHead>Criterio Facturación</TableHead>
                      <TableHead>Dirección Fiscal</TableHead>
                      <TableHead>Datos Bancarios</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.razon_social}</TableCell>
                        <TableCell>{member.condicion_fiscal}</TableCell>
                        <TableCell>{member.criterio_facturacion}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{member.direccion_fiscal}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{member.datos_bancarios || 'No especificado'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleViewMember(member)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleEditMember(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="contacto" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razón Social</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Sitio Web</TableHead>
                      <TableHead>Actividad Económica</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.razon_social}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.telefono}</TableCell>
                        <TableCell>{member.web || 'No especificado'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{member.actividad_economica || 'No especificado'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleViewMember(member)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleEditMember(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}

          {/* Popup Ver Socio */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[800px] bg-white border-0 shadow-2xl rounded-xl text-black">
              <DialogHeader>
                <DialogTitle>Ver Socio</DialogTitle>
                <DialogDescription>Información del socio seleccionado</DialogDescription>
              </DialogHeader>
              {selectedMember && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="basica" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Básica</TabsTrigger>
                    <TabsTrigger value="contacto" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Contacto</TabsTrigger>
                    <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Fiscal</TabsTrigger>
                    <TabsTrigger value="representante" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Representante</TabsTrigger>
                    <TabsTrigger value="adicional" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Adicional</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basica" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Razón Social</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.razon_social}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>CUIT</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.cuit}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Tipo de Sociedad</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.tipo_sociedad}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Fecha de Constitución</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.fecha_constitucion || "No especificada"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacto" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.email}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Teléfono</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.telefono}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Sitio Web</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.web || "No especificado"}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Dirección Fiscal</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.direccion_fiscal}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fiscal" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Condición Fiscal</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.condicion_fiscal}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Criterio de Facturación</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.criterio_facturacion}</div>
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label>Datos Bancarios</Label>
                        <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">{selectedMember.datos_bancarios || "No especificados"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="representante" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Representante Legal</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.representante_legal}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>DNI Representante</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.dni_representante}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Cargo del Representante</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.cargo_representante}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Actividad Económica</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.actividad_economica || "No especificada"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="adicional" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Registro Mercantil</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedMember.registro_mercantil || "No especificado"}</div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Estado</Label>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <Badge variant={selectedMember.status === "Activo" ? "default" : "secondary"} className={selectedMember.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {selectedMember.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Popup Editar Socio */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[800px] bg-white border-0 shadow-2xl rounded-xl text-black">
              <DialogHeader>
                <DialogTitle>Editar Socio</DialogTitle>
                <DialogDescription>Modifica la información del socio</DialogDescription>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="basica" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Básica</TabsTrigger>
                  <TabsTrigger value="contacto" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Contacto</TabsTrigger>
                  <TabsTrigger value="fiscal" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Fiscal</TabsTrigger>
                  <TabsTrigger value="representante" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Representante</TabsTrigger>
                  <TabsTrigger value="adicional" className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-xs">Adicional</TabsTrigger>
                </TabsList>

                <TabsContent value="basica" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_razon_social">Razón Social *</Label>
                      <Input 
                        id="edit_razon_social" 
                        placeholder="Razón social de la empresa" 
                        value={formData.razon_social}
                        onChange={(e) => handleInputChange('razon_social', e.target.value)}
                        className={`${errors.razon_social ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.razon_social && (
                        <p className="text-red-500 text-xs">{errors.razon_social}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_cuit">CUIT *</Label>
                      <Input 
                        id="edit_cuit" 
                        placeholder="20-12345678-9" 
                        value={formData.cuit}
                        onChange={(e) => handleInputChange('cuit', e.target.value)}
                        className={`${errors.cuit ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.cuit && (
                        <p className="text-red-500 text-xs">{errors.cuit}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_tipo_sociedad">Tipo de Sociedad *</Label>
                      <select 
                        id="edit_tipo_sociedad" 
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.tipo_sociedad ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                        value={formData.tipo_sociedad}
                        onChange={(e) => handleInputChange('tipo_sociedad', e.target.value)}
                      >
                        <option value="" className="text-gray-300">Seleccionar tipo...</option>
                        <option value="S.R.L.">S.R.L.</option>
                        <option value="S.A.">S.A.</option>
                        <option value="Monotributista">Monotributista</option>
                        <option value="Autónomo">Autónomo</option>
                        <option value="Otro">Otro</option>
                      </select>
                      {errors.tipo_sociedad && (
                        <p className="text-red-500 text-xs">{errors.tipo_sociedad}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_fecha_constitucion">Fecha de Constitución</Label>
                      <Input 
                        id="edit_fecha_constitucion" 
                        type="date" 
                        value={formData.fecha_constitucion}
                        onChange={(e) => handleInputChange('fecha_constitucion', e.target.value)}
                        className="placeholder:text-gray-300"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_fk_id_usuario">Usuario Asociado</Label>
                      <select 
                        id="edit_fk_id_usuario" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-gray-300"
                        value={formData.fk_id_usuario || ""}
                        onChange={(e) => handleInputChange('fk_id_usuario', e.target.value)}
                      >
                        <option value="" className="text-gray-300">
                          {usuarios.length === 0 ? "No hay usuarios con rol socio" : "Seleccionar usuario..."}
                        </option>
                        {usuarios.map((usuario) => (
                          <option key={usuario.id} value={usuario.id}>
                            {usuario.nombre} ({usuario.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contacto" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_email">Email *</Label>
                      <Input 
                        id="edit_email" 
                        type="email" 
                        placeholder="socio@email.com" 
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`${errors.email ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs">{errors.email}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_telefono">Teléfono *</Label>
                      <Input 
                        id="edit_telefono" 
                        placeholder="+54 11 1234-5678" 
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        className={`${errors.telefono ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.telefono && (
                        <p className="text-red-500 text-xs">{errors.telefono}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_web">Sitio Web</Label>
                      <Input 
                        id="edit_web" 
                        placeholder="https://www.ejemplo.com" 
                        value={formData.web}
                        onChange={(e) => handleInputChange('web', e.target.value)}
                        className="placeholder:text-gray-300"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_direccion_fiscal">Dirección Fiscal *</Label>
                      <Input 
                        id="edit_direccion_fiscal" 
                        placeholder="Dirección fiscal completa" 
                        value={formData.direccion_fiscal}
                        onChange={(e) => handleInputChange('direccion_fiscal', e.target.value)}
                        className={`${errors.direccion_fiscal ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.direccion_fiscal && (
                        <p className="text-red-500 text-xs">{errors.direccion_fiscal}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fiscal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_condicion_fiscal">Condición Fiscal *</Label>
                      <select 
                        id="edit_condicion_fiscal" 
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.condicion_fiscal ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                        value={formData.condicion_fiscal}
                        onChange={(e) => handleInputChange('condicion_fiscal', e.target.value)}
                      >
                        <option value="" className="text-gray-300">Seleccionar condición...</option>
                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                        <option value="Monotributista">Monotributista</option>
                        <option value="Exento">Exento</option>
                        <option value="Consumidor Final">Consumidor Final</option>
                      </select>
                      {errors.condicion_fiscal && (
                        <p className="text-red-500 text-xs">{errors.condicion_fiscal}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_criterio_facturacion">Criterio de Facturación *</Label>
                      <select 
                        id="edit_criterio_facturacion" 
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.criterio_facturacion ? "border-red-500" : "border-input"} placeholder:text-gray-300`}
                        value={formData.criterio_facturacion}
                        onChange={(e) => handleInputChange('criterio_facturacion', e.target.value)}
                      >
                        <option value="" className="text-gray-300">Seleccionar criterio...</option>
                        <option value="Anticipado">Anticipado</option>
                        <option value="Por entrega">Por entrega</option>
                        <option value="30 días">30 días</option>
                        <option value="60 días">60 días</option>
                        <option value="Contado">Contado</option>
                      </select>
                      {errors.criterio_facturacion && (
                        <p className="text-red-500 text-xs">{errors.criterio_facturacion}</p>
                      )}
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="edit_datos_bancarios">Datos Bancarios</Label>
                      <textarea 
                        id="edit_datos_bancarios" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-gray-300" 
                        placeholder="Información bancaria (cuenta corriente, CBU, etc.)"
                        value={formData.datos_bancarios}
                        onChange={(e) => handleInputChange('datos_bancarios', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="representante" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_representante_legal">Representante Legal *</Label>
                      <Input 
                        id="edit_representante_legal" 
                        placeholder="Nombre completo del representante" 
                        value={formData.representante_legal}
                        onChange={(e) => handleInputChange('representante_legal', e.target.value)}
                        className={`${errors.representante_legal ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.representante_legal && (
                        <p className="text-red-500 text-xs">{errors.representante_legal}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_dni_representante">DNI Representante *</Label>
                      <Input 
                        id="edit_dni_representante" 
                        placeholder="12345678" 
                        value={formData.dni_representante}
                        onChange={(e) => handleInputChange('dni_representante', e.target.value)}
                        className={`${errors.dni_representante ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.dni_representante && (
                        <p className="text-red-500 text-xs">{errors.dni_representante}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_cargo_representante">Cargo del Representante *</Label>
                      <Input 
                        id="edit_cargo_representante" 
                        placeholder="Ej: Presidente, Gerente, etc." 
                        value={formData.cargo_representante}
                        onChange={(e) => handleInputChange('cargo_representante', e.target.value)}
                        className={`${errors.cargo_representante ? "border-red-500" : ""} placeholder:text-gray-300`}
                      />
                      {errors.cargo_representante && (
                        <p className="text-red-500 text-xs">{errors.cargo_representante}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_actividad_economica">Actividad Económica</Label>
                      <Input 
                        id="edit_actividad_economica" 
                        placeholder="Descripción de la actividad principal" 
                        value={formData.actividad_economica}
                        onChange={(e) => handleInputChange('actividad_economica', e.target.value)}
                        className="placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adicional" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_registro_mercantil">Registro Mercantil</Label>
                      <Input 
                        id="edit_registro_mercantil" 
                        placeholder="Número de registro mercantil" 
                        value={formData.registro_mercantil}
                        onChange={(e) => handleInputChange('registro_mercantil', e.target.value)}
                        className="placeholder:text-gray-300"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit_status">Estado *</Label>
                      <select 
                        id="edit_status" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Suspendido">Suspendido</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-black hover:bg-gray-800 text-white"
                  onClick={handleSubmit}
                >
                  Actualizar Socio
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Popup Confirmación Borrar Socio */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-xl text-black">
              <DialogHeader>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription>
                  ¿Estás seguro de que quieres eliminar el socio "{selectedMember?.razon_social}"?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al socio.
                </p>
                {selectedMember && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Socio a eliminar:</h4>
                    <div className="text-sm text-red-700">
                      <p><strong>Razón Social:</strong> {selectedMember.razon_social}</p>
                      <p><strong>CUIT:</strong> {selectedMember.cuit}</p>
                      <p><strong>Email:</strong> {selectedMember.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setSelectedMember(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDelete}
                >
                  Eliminar Socio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
