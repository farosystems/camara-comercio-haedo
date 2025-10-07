"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, User, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Socio, getSocios } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

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

export function MembersListModule() {
  const [members, setMembers] = useState<Socio[]>([])
  const [tiposComercio, setTiposComercio] = useState<TipoComercio[]>([])
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchRazonSocial, setSearchRazonSocial] = useState("")
  const [searchNumero, setSearchNumero] = useState("")
  const [searchTipoSocio, setSearchTipoSocio] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Socio | null>(null)
  const [activeTab, setActiveTab] = useState("identificacion")
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  const { toast } = useToast()

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_socio: "",
    razon_social: "",
    nombre_fantasia: "",
    domicilio_comercial: "",
    nro_comercial: "",
    telefono_comercial: "",
    celular: "",
    mail: "",
    rubro_id: null as number | null,
    tipo_comercio_id: null as number | null,
    fecha_alta: new Date().toISOString().split('T')[0],
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
    fk_id_usuario: null as number | null,
    password: ""
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [sociosData, tiposData, rubrosData] = await Promise.all([
        getSocios(),
        supabase.from('tipo_comercios').select('*').eq('activo', true).order('nombre'),
        supabase.from('rubros').select('*').eq('activo', true).order('nombre')
      ])

      setMembers(sociosData)
      setTiposComercio(tiposData.data || [])
      setRubros(rubrosData.data || [])
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

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData({...formData, [field]: value.toUpperCase()})
  }

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
      fecha_alta: new Date().toISOString().split('T')[0],
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
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

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
      const response = await fetch('/api/socios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando socio')
      }

      toast({
        title: "Socio creado exitosamente",
        description: "El socio fue creado correctamente"
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
      fecha_alta: member.fecha_alta ? new Date(member.fecha_alta).toISOString().split('T')[0] : "",
      fecha_baja: member.fecha_baja ? new Date(member.fecha_baja).toISOString().split('T')[0] : "",
      fecha_nacimiento: member.fecha_nacimiento ? new Date(member.fecha_nacimiento).toISOString().split('T')[0] : "",
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

  const filteredMembers = members.filter(member => {
    const matchesNumero = searchNumero === "" || member.id.toString().includes(searchNumero)
    const matchesRazonSocial = searchRazonSocial === "" || member.razon_social.toLowerCase().includes(searchRazonSocial.toLowerCase())
    const matchesTipoSocio = searchTipoSocio === "all" || searchTipoSocio === "" || member.tipo_socio === searchTipoSocio
    return matchesNumero && matchesRazonSocial && matchesTipoSocio
  })

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Socios</h2>
          <p className="text-muted-foreground">Administra la información de los socios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Socio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Socio</DialogTitle>
              <DialogDescription>
                Completa todos los datos del nuevo socio
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identificacion">Identificación</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
              </TabsList>

              {/* Pestaña Identificación */}
              <TabsContent value="identificacion" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_socio">Nombre del Socio *</Label>
                    <Input
                      id="nombre_socio"
                      value={formData.nombre_socio}
                      onChange={(e) => handleInputChange('nombre_socio', e.target.value)}
                      className={errors.nombre_socio ? "border-red-500" : ""}
                    />
                    {errors.nombre_socio && <p className="text-sm text-red-500">{errors.nombre_socio}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      className={errors.razon_social ? "border-red-500" : ""}
                    />
                    {errors.razon_social && <p className="text-sm text-red-500">{errors.razon_social}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre_fantasia">Nombre Fantasía</Label>
                    <Input
                      id="nombre_fantasia"
                      value={formData.nombre_fantasia}
                      onChange={(e) => handleInputChange('nombre_fantasia', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input
                      id="cuit"
                      value={formData.cuit}
                      onChange={(e) => handleInputChange('cuit', e.target.value)}
                      className={errors.cuit ? "border-red-500" : ""}
                    />
                    {errors.cuit && <p className="text-sm text-red-500">{errors.cuit}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento *</Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => handleInputChange('documento', e.target.value)}
                      className={errors.documento ? "border-red-500" : ""}
                    />
                    {errors.documento && <p className="text-sm text-red-500">{errors.documento}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Input
                      id="nacionalidad"
                      value={formData.nacionalidad}
                      onChange={(e) => handleInputChange('nacionalidad', e.target.value)}
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
                      onChange={(e) => handleInputChange('domicilio_comercial', e.target.value)}
                      className={errors.domicilio_comercial ? "border-red-500" : ""}
                    />
                    {errors.domicilio_comercial && <p className="text-sm text-red-500">{errors.domicilio_comercial}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nro_comercial">Número Comercial</Label>
                    <Input
                      id="nro_comercial"
                      value={formData.nro_comercial}
                      onChange={(e) => handleInputChange('nro_comercial', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mail">Email *</Label>
                    <Input
                      id="mail"
                      type="email"
                      value={formData.mail}
                      onChange={(e) => handleInputChange('mail', e.target.value)}
                      className={errors.mail ? "border-red-500" : ""}
                    />
                    {errors.mail && <p className="text-sm text-red-500">{errors.mail}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono_comercial">Teléfono Comercial</Label>
                    <Input
                      id="telefono_comercial"
                      value={formData.telefono_comercial}
                      onChange={(e) => handleInputChange('telefono_comercial', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono_fijo">Teléfono Fijo</Label>
                    <Input
                      id="telefono_fijo"
                      value={formData.telefono_fijo}
                      onChange={(e) => handleInputChange('telefono_fijo', e.target.value)}
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
                      onChange={(e) => handleInputChange('domicilio_personal', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nro_personal">Número Personal</Label>
                    <Input
                      id="nro_personal"
                      value={formData.nro_personal}
                      onChange={(e) => handleInputChange('nro_personal', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input
                      id="localidad"
                      value={formData.localidad}
                      onChange={(e) => handleInputChange('localidad', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input
                      id="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
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
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="De baja">De baja</SelectItem>
                        <SelectItem value="Prospecto">Prospecto</SelectItem>
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
                      onChange={(e) => handleInputChange('habilitado', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-black hover:bg-gray-800 text-white">
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
            <div className="w-48">
              <Label htmlFor="search-numero">Buscar por Número</Label>
              <Input
                id="search-numero"
                placeholder="Número de socio..."
                value={searchNumero}
                onChange={(e) => {
                  setSearchNumero(e.target.value)
                  setCurrentPage(1)
                }}
                className="border-gray-300 focus:border-gray-400"
              />
            </div>
            <div className="w-64">
              <Label htmlFor="search-razon-social">Buscar por Razón Social</Label>
              <Input
                id="search-razon-social"
                placeholder="Ingrese razón social..."
                value={searchRazonSocial}
                onChange={(e) => {
                  setSearchRazonSocial(e.target.value)
                  setCurrentPage(1)
                }}
                className="border-gray-300 focus:border-gray-400"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="search-tipo-socio">Filtrar por Tipo de Socio</Label>
              <Select
                value={searchTipoSocio}
                onValueChange={(value) => {
                  setSearchTipoSocio(value)
                  setCurrentPage(1)
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
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="De baja">De baja</SelectItem>
                  <SelectItem value="Prospecto">Prospecto</SelectItem>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Tipo de Socio</TableHead>
                    <TableHead>Fecha Alta</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.id}</TableCell>
                      <TableCell>{member.nombre_socio}</TableCell>
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
                              : member.tipo_socio === "Inactivo"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : member.tipo_socio === "De baja"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : member.tipo_socio === "Prospecto"
                              ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }
                        >
                          {member.tipo_socio}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateForDisplay(member.fecha_alta)}</TableCell>
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

              {/* Paginación */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMembers.length)} a {Math.min(currentPage * itemsPerPage, filteredMembers.length)} de {filteredMembers.length} socios
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="text-sm">
                    Página {currentPage} de {Math.ceil(filteredMembers.length / itemsPerPage)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMembers.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredMembers.length / itemsPerPage)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
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

            {/* Mismo contenido de las pestañas pero para edición */}
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

            {/* Resto de pestañas similares para edición... */}
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
              </div>
            </TabsContent>

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
                  <Label htmlFor="edit_localidad">Localidad</Label>
                  <Input
                    id="edit_localidad"
                    value={formData.localidad}
                    onChange={(e) => setFormData({...formData, localidad: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>

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
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="De baja">De baja</SelectItem>
                      <SelectItem value="Prospecto">Prospecto</SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  )
}