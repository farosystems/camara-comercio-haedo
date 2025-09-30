"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Save, X, Building } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TipoComercio {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export function MembersTypesModule() {
  const [tiposComercio, setTiposComercio] = useState<TipoComercio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<TipoComercio | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10
  const { toast } = useToast()

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const cargarTiposComercio = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tipo_comercios')
        .select('*')
        .order('nombre')

      if (error) throw error

      setTiposComercio((data as unknown as TipoComercio[]) || [])
    } catch (err) {
      console.error('Error cargando tipos de comercio:', err)
      setError('Error al cargar los tipos de comercio')
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de comercio",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTiposComercio()
  }, [])

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      activo: true
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
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
      const { data, error } = await supabase
        .from('tipo_comercios')
        .insert([formData])
        .select()

      if (error) throw error

      toast({
        title: "Tipo de comercio creado exitosamente",
        description: "El nuevo tipo de comercio ha sido agregado"
      })

      resetForm()
      setIsDialogOpen(false)
      cargarTiposComercio()

    } catch (error: any) {
      console.error('Error creando tipo de comercio:', error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el tipo de comercio",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tipo: TipoComercio) => {
    setSelectedTipo(tipo)
    setFormData({
      nombre: tipo.nombre || "",
      descripcion: tipo.descripcion || "",
      activo: tipo.activo
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || !selectedTipo) return

    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('tipo_comercios')
        .update(formData)
        .eq('id', selectedTipo.id)
        .select()

      if (error) throw error

      toast({
        title: "Tipo de comercio actualizado exitosamente",
        description: "Los cambios han sido guardados"
      })

      setIsEditDialogOpen(false)
      setSelectedTipo(null)
      resetForm()
      cargarTiposComercio()

    } catch (error: any) {
      console.error('Error actualizando tipo de comercio:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el tipo de comercio",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (tipo: TipoComercio) => {
    try {
      const { error } = await supabase
        .from('tipo_comercios')
        .update({ activo: !tipo.activo })
        .eq('id', tipo.id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Tipo de comercio ${!tipo.activo ? 'activado' : 'desactivado'} correctamente`
      })

      cargarTiposComercio()

    } catch (error: any) {
      console.error('Error actualizando estado:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const filteredTipos = tiposComercio.filter(tipo =>
    tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedTipos = filteredTipos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tipos de Comercio</h2>
          <p className="text-muted-foreground">Administra los tipos de comercio disponibles para los socios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo de Comercio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Tipo de Comercio</DialogTitle>
              <DialogDescription>
                Agrega un nuevo tipo de comercio para los socios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className={errors.nombre ? "border-red-500" : ""}
                />
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Tipo de Comercio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de tipos de comercio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700">Listado de Tipos de Comercio</CardTitle>
          <CardDescription>Gestiona todos los tipos de comercio disponibles</CardDescription>

          {/* Filtro de búsqueda */}
          <div className="flex gap-4 mt-4">
            <div className="w-64">
              <Label htmlFor="search">Buscar tipo de comercio</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="border-gray-300 focus:border-gray-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando tipos de comercio...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <Button onClick={cargarTiposComercio} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Reintentar
                </Button>
              </div>
            </div>
          ) : tiposComercio.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay tipos de comercio registrados</p>
              </div>
            </div>
          ) : (
            <>
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
                  {paginatedTipos.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>{tipo.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tipo.activo ? "default" : "secondary"}
                          className={tipo.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {tipo.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tipo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivo(tipo)}
                            className={tipo.activo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            {tipo.activo ? "Desactivar" : "Activar"}
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
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTipos.length)} a {Math.min(currentPage * itemsPerPage, filteredTipos.length)} de {filteredTipos.length} tipos de comercio
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
                    Página {currentPage} de {Math.ceil(filteredTipos.length / itemsPerPage)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTipos.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredTipos.length / itemsPerPage)}
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
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Comercio</DialogTitle>
            <DialogDescription>
              Modifica los datos del tipo de comercio seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nombre">Nombre *</Label>
              <Input
                id="edit_nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_descripcion">Descripción</Label>
              <Input
                id="edit_descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setSelectedTipo(null)
              resetForm()
            }}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Actualizar Tipo de Comercio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}