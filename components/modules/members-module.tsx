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
import { Plus, Edit, Trash2, Eye, User, Save, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Socio, getSocios } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { getArgentinaDateString, formatDateForDisplay, dateStringToInputValue } from "@/lib/date-utils"

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

interface TipoComercio {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
}

interface Rubro {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
}

export function MembersModule() {
  const [members, setMembers] = useState<Socio[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [tiposComercio, setTiposComercio] = useState<TipoComercio[]>([])
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [loading, setLoading] = useState(true)
  const [isRubroDialogOpen, setIsRubroDialogOpen] = useState(false)
  const [isTipoComercioDialogOpen, setIsTipoComercioDialogOpen] = useState(false)
  const [nuevoRubro, setNuevoRubro] = useState({ nombre: "", descripcion: "" })
  const [nuevoTipoComercio, setNuevoTipoComercio] = useState({ nombre: "", descripcion: "" })
  const [currentRubrosPage, setCurrentRubrosPage] = useState(1)
  const [currentTipoComerciosPage, setCurrentTipoComerciosPage] = useState(1)
  const [currentMembersPage, setCurrentMembersPage] = useState(1)
  const itemsPerPage = 10
  const membersPerPage = 15
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false)
  const [migrationFile, setMigrationFile] = useState<File | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchRazonSocial, setSearchRazonSocial] = useState("")
  const [searchTipoSocio, setSearchTipoSocio] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Socio | null>(null)
  const [activeTab, setActiveTab] = useState("identificacion")
  const [saving, setSaving] = useState(false)
  
  // Estado del formulario actualizado con todos los nuevos campos
  const [formData, setFormData] = useState({
    // Identificación del socio
    nombre_socio: "",
    razon_social: "",
    nombre_fantasia: "",
    
    // Domicilio comercial
    domicilio_comercial: "",
    nro_comercial: "",
    
    // Contacto comercial
    telefono_comercial: "",
    celular: "",
    mail: "",
    
    // Comercialización
    rubro_id: null as number | null,
    tipo_comercio_id: null as number | null,
    
    // Fechas
    fecha_alta: getArgentinaDateString(),
    fecha_baja: "",
    
    // Datos personales del representante
    fecha_nacimiento: "",
    documento: "",
    estado_civil: "",
    nacionalidad: "Argentina",
    
    // Domicilio personal
    domicilio_personal: "",
    nro_personal: "",
    localidad: "",
    codigo_postal: "",
    telefono_fijo: "",
    
    // Datos fiscales
    cuit: "",
    
    // Estado
    habilitado: "",
    tipo_socio: "Activo",
    
    // Usuario relacionado
    fk_id_usuario: null as number | null,
    password: ""
  })
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})
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
      const { data: allUsers, error: allError } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol')
        .order('nombre')

      if (allError) {
        console.error('Error cargando usuarios:', allError)
        return
      }

      const usuariosSocio = allUsers?.filter((user: Usuario) => user.rol === 'socio') || []
      setUsuarios(usuariosSocio)
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    }
  }

  // Función para cargar tipos de comercio
  const cargarTiposComercio = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_comercios')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) {
        console.error('Error cargando tipos de comercio:', error)
        return
      }

      setTiposComercio(data || [])
    } catch (err) {
      console.error('Error cargando tipos de comercio:', err)
    }
  }

  // Función para cargar rubros
  const cargarRubros = async () => {
    try {
      const { data, error } = await supabase
        .from('rubros')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) {
        console.error('Error cargando rubros:', error)
        return
      }

      setRubros(data || [])
    } catch (err) {
      console.error('Error cargando rubros:', err)
    }
  }

  useEffect(() => {
    cargarDatos()
    cargarUsuarios()
    cargarTiposComercio()
    cargarRubros()
  }, [])

  const resetForm = () => {
    setFormData({
      nombre_socio: "",
      razon_social: "",
      nombre_fantasia: "",
      domicilio_comercial: "",
      nro_comercial: "",
      telefono_comercial: "",
      celular: "",
      mail: "",
      rubro_id: null,
      tipo_comercio_id: null,
      fecha_alta: getArgentinaDateString(),
      fecha_baja: "",
      fecha_nacimiento: "",
      documento: "",
      estado_civil: "",
      nacionalidad: "Argentina",
      domicilio_personal: "",
      nro_personal: "",
      localidad: "",
      codigo_postal: "",
      telefono_fijo: "",
      cuit: "",
      habilitado: "",
      tipo_socio: "Activo",
      fk_id_usuario: null,
      password: ""
    })
    setErrors({})
    setActiveTab("identificacion")
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
          email: socioData.mail,
          password: formData.password,
          firstName: socioData.nombre_socio.split(' ')[0] || socioData.nombre_socio,
          lastName: socioData.nombre_socio.split(' ').slice(1).join(' ') || '',
          representanteLegal: socioData.nombre_socio,
          telefono: socioData.telefono_comercial || socioData.celular
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
    
    // Validaciones obligatorias
    if (!formData.nombre_socio.trim()) {
      newErrors.nombre_socio = "El nombre del socio es obligatorio"
    }
    if (!formData.razon_social.trim()) {
      newErrors.razon_social = "La razón social es obligatoria"
    }
    if (!formData.domicilio_comercial.trim()) {
      newErrors.domicilio_comercial = "El domicilio comercial es obligatorio"
    }
    if (!formData.mail.trim()) {
      newErrors.mail = "El email es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formData.mail)) {
      newErrors.mail = "El email no es válido"
    }
    if (!formData.documento.trim()) {
      newErrors.documento = "El documento es obligatorio"
    }
    if (!formData.cuit.trim()) {
      newErrors.cuit = "El CUIT es obligatorio"
    }

    // Validar contraseña si se va a crear usuario
    if (autoCreateUser && !formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria para crear el usuario"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      let usuarioId = null

      // Crear usuario en Clerk if autoCreateUser is true
      if (autoCreateUser) {
        usuarioId = await createUserInClerk(formData)
      }

      // Preparar datos para crear el socio
      const socioData = {
        ...formData,
        fk_id_usuario: usuarioId || formData.fk_id_usuario
      }

      // Remover la contraseña de los datos del socio
      const { password, ...socioDataWithoutPassword } = socioData

      const response = await fetch('/api/socios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioDataWithoutPassword)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando socio')
      }

      toast({
        title: "Socio creado exitosamente",
        description: autoCreateUser ? "Se creó el socio y su usuario automáticamente" : "El socio fue creado correctamente"
      })

      resetForm()
      setIsDialogOpen(false)
      cargarDatos()
      
    } catch (error: any) {
      console.error('Error creando socio:', error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el socio",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (member: Socio) => {
    setSelectedMember(member)
    setFormData({
      nombre_socio: member.nombre_socio || "",
      razon_social: member.razon_social || "",
      nombre_fantasia: member.nombre_fantasia || "",
      domicilio_comercial: member.domicilio_comercial || "",
      nro_comercial: member.nro_comercial || "",
      telefono_comercial: member.telefono_comercial || "",
      celular: member.celular || "",
      mail: member.mail || "",
      rubro_id: member.rubro_id || null,
      tipo_comercio_id: member.tipo_comercio_id || null,
      fecha_alta: dateStringToInputValue(member.fecha_alta) || "",
      fecha_baja: dateStringToInputValue(member.fecha_baja) || "",
      fecha_nacimiento: dateStringToInputValue(member.fecha_nacimiento) || "",
      documento: member.documento || "",
      estado_civil: member.estado_civil || "",
      nacionalidad: member.nacionalidad || "Argentina",
      domicilio_personal: member.domicilio_personal || "",
      nro_personal: member.nro_personal || "",
      localidad: member.localidad || "",
      codigo_postal: member.codigo_postal || "",
      telefono_fijo: member.telefono_fijo || "",
      cuit: member.cuit || "",
      habilitado: member.habilitado || "",
      tipo_socio: member.tipo_socio || "Activo",
      fk_id_usuario: member.fk_id_usuario,
      password: ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || !selectedMember) return

    try {
      setSaving(true)
      const { password, ...socioDataWithoutPassword } = formData

      const response = await fetch(`/api/socios/update/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socioDataWithoutPassword)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error actualizando socio')
      }

      toast({
        title: "Socio actualizado exitosamente",
        description: "Los cambios han sido guardados"
      })

      setIsEditDialogOpen(false)
      setSelectedMember(null)
      cargarDatos()
      
    } catch (error: any) {
      console.error('Error actualizando socio:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el socio",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatearFecha = (fecha: string | null) => {
    return formatDateForDisplay(fecha)
  }

  const handleCreateRubro = async () => {
    if (!nuevoRubro.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rubro es obligatorio",
        variant: "destructive"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('rubros')
        .insert([nuevoRubro])
        .select()

      if (error) throw error

      toast({
        title: "Rubro creado exitosamente",
        description: "El nuevo rubro ha sido agregado"
      })

      setNuevoRubro({ nombre: "", descripcion: "" })
      setIsRubroDialogOpen(false)
      cargarRubros()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el rubro",
        variant: "destructive"
      })
    }
  }

  const handleCreateTipoComercio = async () => {
    if (!nuevoTipoComercio.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del tipo de comercio es obligatorio",
        variant: "destructive"
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('tipo_comercios')
        .insert([nuevoTipoComercio])
        .select()

      if (error) throw error

      toast({
        title: "Tipo de comercio creado exitosamente",
        description: "El nuevo tipo de comercio ha sido agregado"
      })

      setNuevoTipoComercio({ nombre: "", descripcion: "" })
      setIsTipoComercioDialogOpen(false)
      cargarTiposComercio()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el tipo de comercio",
        variant: "destructive"
      })
    }
  }

  const handleMigration = async () => {
    if (!migrationFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo para migrar",
        variant: "destructive"
      })
      return
    }

    setMigrating(true)

    try {
      const formData = new FormData()
      formData.append('file', migrationFile)

      const response = await fetch('/api/socios/migrate', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error en la migración')
      }

      toast({
        title: "Migración exitosa",
        description: `Se migraron ${result.count} socios correctamente`
      })

      setMigrationFile(null)
      setIsMigrationDialogOpen(false)
      cargarDatos() // Recargar la lista de socios

    } catch (error: any) {
      toast({
        title: "Error en la migración",
        description: error.message || "Error al procesar el archivo",
        variant: "destructive"
      })
    } finally {
      setMigrating(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ]

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)",
          variant: "destructive"
        })
        return
      }

      setMigrationFile(file)
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
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Socio
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setIsMigrationDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Migrar Socios
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Socio</DialogTitle>
              <DialogDescription>
                Completa todos los datos del nuevo socio
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="identificacion">Identificación</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
                <TabsTrigger value="usuario">Usuario</TabsTrigger>
              </TabsList>

              {/* Pestaña Identificación */}
              <TabsContent value="identificacion" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_socio">Nombre del Socio *</Label>
                    <Input
                      id="nombre_socio"
                      value={formData.nombre_socio}
                      onChange={(e) => setFormData({...formData, nombre_socio: e.target.value})}
                      className={errors.nombre_socio ? "border-red-500" : ""}
                    />
                    {errors.nombre_socio && <p className="text-sm text-red-500">{errors.nombre_socio}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                      className={errors.razon_social ? "border-red-500" : ""}
                    />
                    {errors.razon_social && <p className="text-sm text-red-500">{errors.razon_social}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                    <Input
                      id="nombre_fantasia"
                      value={formData.nombre_fantasia}
                      onChange={(e) => setFormData({...formData, nombre_fantasia: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input
                      id="cuit"
                      value={formData.cuit}
                      onChange={(e) => setFormData({...formData, cuit: e.target.value})}
                      className={errors.cuit ? "border-red-500" : ""}
                    />
                    {errors.cuit && <p className="text-sm text-red-500">{errors.cuit}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento *</Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => setFormData({...formData, documento: e.target.value})}
                      className={errors.documento ? "border-red-500" : ""}
                    />
                    {errors.documento && <p className="text-sm text-red-500">{errors.documento}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Input
                      id="nacionalidad"
                      value={formData.nacionalidad}
                      onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pestaña Contacto */}
              <TabsContent value="contacto" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domicilio_comercial">Domicilio Comercial *</Label>
                    <Input
                      id="domicilio_comercial"
                      value={formData.domicilio_comercial}
                      onChange={(e) => setFormData({...formData, domicilio_comercial: e.target.value})}
                      className={errors.domicilio_comercial ? "border-red-500" : ""}
                    />
                    {errors.domicilio_comercial && <p className="text-sm text-red-500">{errors.domicilio_comercial}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nro_comercial">Número Comercial</Label>
                    <Input
                      id="nro_comercial"
                      value={formData.nro_comercial}
                      onChange={(e) => setFormData({...formData, nro_comercial: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mail">Email *</Label>
                    <Input
                      id="mail"
                      type="email"
                      value={formData.mail}
                      onChange={(e) => setFormData({...formData, mail: e.target.value})}
                      className={errors.mail ? "border-red-500" : ""}
                    />
                    {errors.mail && <p className="text-sm text-red-500">{errors.mail}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefono_comercial">Teléfono Comercial</Label>
                    <Input
                      id="telefono_comercial"
                      value={formData.telefono_comercial}
                      onChange={(e) => setFormData({...formData, telefono_comercial: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefono_fijo">Teléfono Fijo</Label>
                    <Input
                      id="telefono_fijo"
                      value={formData.telefono_fijo}
                      onChange={(e) => setFormData({...formData, telefono_fijo: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pestaña Personal */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado_civil">Estado Civil</Label>
                    <Select 
                      value={formData.estado_civil} 
                      onValueChange={(value) => setFormData({...formData, estado_civil: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado civil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Soltero">Soltero</SelectItem>
                        <SelectItem value="Casado">Casado</SelectItem>
                        <SelectItem value="Divorciado">Divorciado</SelectItem>
                        <SelectItem value="Viudo">Viudo</SelectItem>
                        <SelectItem value="Unión de hecho">Unión de hecho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="domicilio_personal">Domicilio Personal</Label>
                    <Input
                      id="domicilio_personal"
                      value={formData.domicilio_personal}
                      onChange={(e) => setFormData({...formData, domicilio_personal: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nro_personal">Número Personal</Label>
                    <Input
                      id="nro_personal"
                      value={formData.nro_personal}
                      onChange={(e) => setFormData({...formData, nro_personal: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input
                      id="localidad"
                      value={formData.localidad}
                      onChange={(e) => setFormData({...formData, localidad: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pestaña Comercial */}
              <TabsContent value="comercial" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rubro_id">Rubro</Label>
                    <Select
                      value={formData.rubro_id?.toString() || "0"}
                      onValueChange={(value) => setFormData({...formData, rubro_id: value === "0" ? null : parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rubro" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="0">Ninguno</SelectItem>
                        {rubros.map((rubro) => (
                          <SelectItem key={rubro.id} value={rubro.id.toString()}>
                            {rubro.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_comercio_id">Tipo de Comercio</Label>
                    <Select
                      value={formData.tipo_comercio_id?.toString() || "0"}
                      onValueChange={(value) => setFormData({...formData, tipo_comercio_id: value === "0" ? null : parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de comercio" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="0">Ninguno</SelectItem>
                        {tiposComercio.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fecha_alta">Fecha de Alta</Label>
                    <Input
                      id="fecha_alta"
                      type="date"
                      value={formData.fecha_alta}
                      onChange={(e) => setFormData({...formData, fecha_alta: e.target.value})}
                    />
                  </div>
                  
                  
                  <div className="space-y-2">
                    <Label htmlFor="tipo_socio">Tipo de Socio</Label>
                    <Select
                      value={formData.tipo_socio}
                      onValueChange={(value) => setFormData({...formData, tipo_socio: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Adherente">Adherente</SelectItem>
                        <SelectItem value="Vitalicio">Vitalicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="habilitado">Estado de Habilitación</Label>
                    <Input
                      id="habilitado"
                      value={formData.habilitado}
                      onChange={(e) => setFormData({...formData, habilitado: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pestaña Usuario */}
              <TabsContent value="usuario" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoCreateUser"
                      checked={autoCreateUser}
                      onCheckedChange={(checked) => setAutoCreateUser(checked as boolean)}
                    />
                    <Label htmlFor="autoCreateUser">Crear usuario automáticamente en Clerk</Label>
                  </div>
                  
                  {autoCreateUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>
                  )}
                  
                  {!autoCreateUser && (
                    <div className="space-y-2">
                      <Label htmlFor="fk_id_usuario">Usuario existente</Label>
                      <Select
                        value={formData.fk_id_usuario?.toString() || "0"}
                        onValueChange={(value) => setFormData({...formData, fk_id_usuario: value === "0" ? null : parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario existente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Ninguno</SelectItem>
                          {usuarios.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.nombre} - {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Socio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de socios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Listado de Socios</CardTitle>
          <CardDescription>Gestiona todos los socios registrados</CardDescription>

          {/* Filtros de búsqueda */}
          <div className="flex gap-4 mt-4">
            <div className="w-64">
              <Label htmlFor="search-razon-social">Buscar por Razón Social</Label>
              <Input
                id="search-razon-social"
                placeholder="Ingrese razón social..."
                value={searchRazonSocial}
                onChange={(e) => {
                  setSearchRazonSocial(e.target.value)
                  setCurrentMembersPage(1) // Reset to first page when searching
                }}
                className="border-gray-300 focus:border-gray-400"
              />
            </div>
            <div className="w-64">
              <Label htmlFor="search-tipo-socio">Filtrar por Tipo de Socio</Label>
              <Select
                value={searchTipoSocio}
                onValueChange={(value) => {
                  setSearchTipoSocio(value)
                  setCurrentMembersPage(1) // Reset to first page when filtering
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Adherente">Adherente</SelectItem>
                  <SelectItem value="Vitalicio">Vitalicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                <Button onClick={cargarDatos} className="bg-black hover:bg-gray-800 text-white">
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
            <>
            {(() => {
              const filteredMembers = members.filter(member => {
                const matchesRazonSocial = member.razon_social.toLowerCase().includes(searchRazonSocial.toLowerCase())
                const matchesTipoSocio = searchTipoSocio === "all" || searchTipoSocio === "" || member.tipo_socio === searchTipoSocio
                return matchesRazonSocial && matchesTipoSocio
              })

              return (
                <>
                  <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Tipo de Socio</TableHead>
                  <TableHead>Fecha Alta</TableHead>
                  <TableHead>Fecha Baja</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers
                  .slice((currentMembersPage - 1) * membersPerPage, currentMembersPage * membersPerPage)
                  .map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.nombre_socio}</TableCell>
                    <TableCell>{member.razon_social}</TableCell>
                    <TableCell>{member.mail}</TableCell>
                    <TableCell>{member.cuit}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          member.tipo_socio === "Activo"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : member.tipo_socio === "Adherente"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : member.tipo_socio === "Vitalicio"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }
                      >
                        {member.tipo_socio}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatearFecha(member.fecha_alta)}</TableCell>
                    <TableCell>{member.fecha_baja ? formatearFecha(member.fecha_baja) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación para Socios */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {Math.min((currentMembersPage - 1) * membersPerPage + 1, filteredMembers.length)} a {Math.min(currentMembersPage * membersPerPage, filteredMembers.length)} de {filteredMembers.length} socios
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMembersPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentMembersPage === 1}
                >
                  Anterior
                </Button>
                <div className="text-sm">
                  Página {currentMembersPage} de {Math.ceil(filteredMembers.length / membersPerPage)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMembersPage(prev => Math.min(prev + 1, Math.ceil(filteredMembers.length / membersPerPage)))}
                  disabled={currentMembersPage === Math.ceil(filteredMembers.length / membersPerPage)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
                </>
              )
            })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición - similar estructura pero con handleUpdate */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
            <DialogDescription>
              Modifica los datos del socio seleccionado
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identificacion">Identificación</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="comercial">Comercial</TabsTrigger>
            </TabsList>
            
            {/* Mismo contenido de las pestañas pero sin la pestaña usuario */}
            <TabsContent value="identificacion" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_nombre_socio">Nombre del Socio *</Label>
                  <Input
                    id="edit_nombre_socio"
                    value={formData.nombre_socio}
                    onChange={(e) => setFormData({...formData, nombre_socio: e.target.value})}
                    className={errors.nombre_socio ? "border-red-500" : ""}
                  />
                  {errors.nombre_socio && <p className="text-sm text-red-500">{errors.nombre_socio}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_razon_social">Razón Social *</Label>
                  <Input
                    id="edit_razon_social"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
                    className={errors.razon_social ? "border-red-500" : ""}
                  />
                  {errors.razon_social && <p className="text-sm text-red-500">{errors.razon_social}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_nombre_fantasia">Nombre Fantasía</Label>
                  <Input
                    id="edit_nombre_fantasia"
                    value={formData.nombre_fantasia}
                    onChange={(e) => setFormData({...formData, nombre_fantasia: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_cuit">CUIT *</Label>
                  <Input
                    id="edit_cuit"
                    value={formData.cuit}
                    onChange={(e) => setFormData({...formData, cuit: e.target.value})}
                    className={errors.cuit ? "border-red-500" : ""}
                  />
                  {errors.cuit && <p className="text-sm text-red-500">{errors.cuit}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_documento">Documento *</Label>
                  <Input
                    id="edit_documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({...formData, documento: e.target.value})}
                    className={errors.documento ? "border-red-500" : ""}
                  />
                  {errors.documento && <p className="text-sm text-red-500">{errors.documento}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_nacionalidad">Nacionalidad</Label>
                  <Input
                    id="edit_nacionalidad"
                    value={formData.nacionalidad}
                    onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña Contacto */}
            <TabsContent value="contacto" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_domicilio_comercial">Domicilio Comercial *</Label>
                  <Input
                    id="edit_domicilio_comercial"
                    value={formData.domicilio_comercial}
                    onChange={(e) => setFormData({...formData, domicilio_comercial: e.target.value})}
                    className={errors.domicilio_comercial ? "border-red-500" : ""}
                  />
                  {errors.domicilio_comercial && <p className="text-sm text-red-500">{errors.domicilio_comercial}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_nro_comercial">Número Comercial</Label>
                  <Input
                    id="edit_nro_comercial"
                    value={formData.nro_comercial}
                    onChange={(e) => setFormData({...formData, nro_comercial: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_mail">Email *</Label>
                  <Input
                    id="edit_mail"
                    type="email"
                    value={formData.mail}
                    onChange={(e) => setFormData({...formData, mail: e.target.value})}
                    className={errors.mail ? "border-red-500" : ""}
                  />
                  {errors.mail && <p className="text-sm text-red-500">{errors.mail}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_telefono_comercial">Teléfono Comercial</Label>
                  <Input
                    id="edit_telefono_comercial"
                    value={formData.telefono_comercial}
                    onChange={(e) => setFormData({...formData, telefono_comercial: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_celular">Celular</Label>
                  <Input
                    id="edit_celular"
                    value={formData.celular}
                    onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_telefono_fijo">Teléfono Fijo</Label>
                  <Input
                    id="edit_telefono_fijo"
                    value={formData.telefono_fijo}
                    onChange={(e) => setFormData({...formData, telefono_fijo: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña Personal */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="edit_fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_estado_civil">Estado Civil</Label>
                  <Select 
                    value={formData.estado_civil} 
                    onValueChange={(value) => setFormData({...formData, estado_civil: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soltero">Soltero</SelectItem>
                      <SelectItem value="Casado">Casado</SelectItem>
                      <SelectItem value="Divorciado">Divorciado</SelectItem>
                      <SelectItem value="Viudo">Viudo</SelectItem>
                      <SelectItem value="Unión de hecho">Unión de hecho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_domicilio_personal">Domicilio Personal</Label>
                  <Input
                    id="edit_domicilio_personal"
                    value={formData.domicilio_personal}
                    onChange={(e) => setFormData({...formData, domicilio_personal: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_nro_personal">Número Personal</Label>
                  <Input
                    id="edit_nro_personal"
                    value={formData.nro_personal}
                    onChange={(e) => setFormData({...formData, nro_personal: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_localidad">Localidad</Label>
                  <Input
                    id="edit_localidad"
                    value={formData.localidad}
                    onChange={(e) => setFormData({...formData, localidad: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_codigo_postal">Código Postal</Label>
                  <Input
                    id="edit_codigo_postal"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Pestaña Comercial */}
            <TabsContent value="comercial" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_rubro_id">Rubro</Label>
                  <Select
                    value={formData.rubro_id?.toString() || "0"}
                    onValueChange={(value) => setFormData({...formData, rubro_id: value === "0" ? null : parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rubro" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      <SelectItem value="0">Ninguno</SelectItem>
                      {rubros.map((rubro) => (
                        <SelectItem key={rubro.id} value={rubro.id.toString()}>
                          {rubro.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_tipo_comercio_id">Tipo de Comercio</Label>
                  <Select
                    value={formData.tipo_comercio_id?.toString() || "0"}
                    onValueChange={(value) => setFormData({...formData, tipo_comercio_id: value === "0" ? null : parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de comercio" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      <SelectItem value="0">Ninguno</SelectItem>
                      {tiposComercio.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_alta">Fecha de Alta</Label>
                  <Input
                    id="edit_fecha_alta"
                    type="date"
                    value={formData.fecha_alta}
                    onChange={(e) => setFormData({...formData, fecha_alta: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_fecha_baja">Fecha de Baja</Label>
                  <Input
                    id="edit_fecha_baja"
                    type="date"
                    value={formData.fecha_baja}
                    onChange={(e) => setFormData({...formData, fecha_baja: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_tipo_socio">Tipo de Socio</Label>
                  <Select
                    value={formData.tipo_socio}
                    onValueChange={(value) => setFormData({...formData, tipo_socio: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Adherente">Adherente</SelectItem>
                      <SelectItem value="Vitalicio">Vitalicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_habilitado">Estado de Habilitación</Label>
                  <Input
                    id="edit_habilitado"
                    value={formData.habilitado}
                    onChange={(e) => setFormData({...formData, habilitado: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Actualizar Socio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabla de Gestión de Rubros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-700">Gestión de Rubros</CardTitle>
              <CardDescription>Administra los rubros de actividad de los socios</CardDescription>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsRubroDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Rubro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubros
                .slice((currentRubrosPage - 1) * itemsPerPage, currentRubrosPage * itemsPerPage)
                .map((rubro) => (
                  <TableRow key={rubro.id}>
                    <TableCell className="font-medium">{rubro.nombre}</TableCell>
                    <TableCell>{rubro.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant={rubro.activo ? "default" : "secondary"}>
                        {rubro.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>

          {/* Paginación para Rubros */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentRubrosPage - 1) * itemsPerPage + 1, rubros.length)} a {Math.min(currentRubrosPage * itemsPerPage, rubros.length)} de {rubros.length} rubros
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRubrosPage(prev => Math.max(prev - 1, 1))}
                disabled={currentRubrosPage === 1}
              >
                Anterior
              </Button>
              <div className="text-sm">
                Página {currentRubrosPage} de {Math.ceil(rubros.length / itemsPerPage)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRubrosPage(prev => Math.min(prev + 1, Math.ceil(rubros.length / itemsPerPage)))}
                disabled={currentRubrosPage === Math.ceil(rubros.length / itemsPerPage)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Gestión de Tipos de Comercio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-purple-700">Gestión de Tipos de Comercio</CardTitle>
              <CardDescription>Administra los tipos de comercio disponibles para los socios</CardDescription>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsTipoComercioDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo de Comercio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposComercio
                .slice((currentTipoComerciosPage - 1) * itemsPerPage, currentTipoComerciosPage * itemsPerPage)
                .map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nombre}</TableCell>
                    <TableCell>{tipo.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant={tipo.activo ? "default" : "secondary"}>
                        {tipo.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>

          {/* Paginación para Tipos de Comercio */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentTipoComerciosPage - 1) * itemsPerPage + 1, tiposComercio.length)} a {Math.min(currentTipoComerciosPage * itemsPerPage, tiposComercio.length)} de {tiposComercio.length} tipos de comercio
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTipoComerciosPage(prev => Math.max(prev - 1, 1))}
                disabled={currentTipoComerciosPage === 1}
              >
                Anterior
              </Button>
              <div className="text-sm">
                Página {currentTipoComerciosPage} de {Math.ceil(tiposComercio.length / itemsPerPage)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentTipoComerciosPage(prev => Math.min(prev + 1, Math.ceil(tiposComercio.length / itemsPerPage)))}
                disabled={currentTipoComerciosPage === Math.ceil(tiposComercio.length / itemsPerPage)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para crear nuevo rubro */}
      <Dialog open={isRubroDialogOpen} onOpenChange={setIsRubroDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rubro</DialogTitle>
            <DialogDescription>
              Agrega un nuevo rubro de actividad para los socios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo_rubro_nombre">Nombre *</Label>
              <Input
                id="nuevo_rubro_nombre"
                value={nuevoRubro.nombre}
                onChange={(e) => setNuevoRubro({...nuevoRubro, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo_rubro_descripcion">Descripción</Label>
              <Input
                id="nuevo_rubro_descripcion"
                value={nuevoRubro.descripcion}
                onChange={(e) => setNuevoRubro({...nuevoRubro, descripcion: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsRubroDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleCreateRubro} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              Crear Rubro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear nuevo tipo de comercio */}
      <Dialog open={isTipoComercioDialogOpen} onOpenChange={setIsTipoComercioDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Comercio</DialogTitle>
            <DialogDescription>
              Agrega un nuevo tipo de comercio para los socios
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo_tipo_comercio_nombre">Nombre *</Label>
              <Input
                id="nuevo_tipo_comercio_nombre"
                value={nuevoTipoComercio.nombre}
                onChange={(e) => setNuevoTipoComercio({...nuevoTipoComercio, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo_tipo_comercio_descripcion">Descripción</Label>
              <Input
                id="nuevo_tipo_comercio_descripcion"
                value={nuevoTipoComercio.descripcion}
                onChange={(e) => setNuevoTipoComercio({...nuevoTipoComercio, descripcion: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsTipoComercioDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleCreateTipoComercio} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              Crear Tipo de Comercio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para migrar socios desde Excel/CSV */}
      <Dialog open={isMigrationDialogOpen} onOpenChange={setIsMigrationDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Migrar Socios desde Archivo</DialogTitle>
            <DialogDescription>
              Importa socios desde un archivo Excel (.xlsx, .xls) o CSV (.csv)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="migration_file">Archivo de migración</Label>
              <Input
                id="migration_file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={migrating}
              />
              {migrationFile && (
                <p className="text-sm text-green-600">
                  Archivo seleccionado: {migrationFile.name}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Columnas requeridas en el archivo:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>• nombre_socio</div>
                  <div>• tipo_socio</div>
                  <div>• razon_social</div>
                  <div>• nombre_fantasia</div>
                  <div>• domicilio_comercial</div>
                  <div>• nro_comercial</div>
                  <div>• telefono_comercial</div>
                  <div>• celular</div>
                  <div>• mail</div>
                  <div>• comercializa</div>
                  <div>• rubro</div>
                  <div>• fecha_alta</div>
                  <div>• fecha_baja</div>
                  <div>• fecha_nacimiento</div>
                  <div>• documento</div>
                  <div>• nacionalidad</div>
                  <div>• estado_civil</div>
                  <div>• domicilio_personal</div>
                  <div>• nro_personal</div>
                  <div>• localidad</div>
                  <div>• codigo_postal</div>
                  <div>• telefono_fijo</div>
                  <div>• cuit</div>
                  <div>• habilitado</div>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Nota: Los campos 'rubro' y 'comercializa' deben contener los nombres exactos de las tablas de referencia.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsMigrationDialogOpen(false)
                setMigrationFile(null)
              }}
              disabled={migrating}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleMigration}
              disabled={!migrationFile || migrating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {migrating ? "Migrando..." : "Migrar Socios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}