"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Save, X, Tag } from "lucide-react"
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

interface Rubro {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export function MembersCategoriesModule() {
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRubro, setSelectedRubro] = useState<Rubro | null>(null)
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

  const cargarRubros = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('rubros')
        .select('*')
        .order('nombre')

      if (error) throw error

      setRubros(data || [])
    } catch (err) {
      console.error('Error cargando rubros:', err)
      setError('Error al cargar los rubros')
      toast({
        title: "Error",
        description: "No se pudieron cargar los rubros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRubros()
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
        .from('rubros')
        .insert([formData])
        .select()

      if (error) throw error

      toast({
        title: "Rubro creado exitosamente",
        description: "El nuevo rubro ha sido agregado"
      })

      resetForm()
      setIsDialogOpen(false)
      cargarRubros()

    } catch (error: any) {
      console.error('Error creando rubro:', error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el rubro",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rubro: Rubro) => {
    setSelectedRubro(rubro)
    setFormData({
      nombre: rubro.nombre || "",
      descripcion: rubro.descripcion || "",
      activo: rubro.activo
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || !selectedRubro) return

    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('rubros')
        .update(formData)
        .eq('id', selectedRubro.id)
        .select()

      if (error) throw error

      toast({
        title: "Rubro actualizado exitosamente",
        description: "Los cambios han sido guardados"
      })

      setIsEditDialogOpen(false)
      setSelectedRubro(null)
      resetForm()
      cargarRubros()

    } catch (error: any) {
      console.error('Error actualizando rubro:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el rubro",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (rubro: Rubro) => {
    try {
      const { error } = await supabase
        .from('rubros')
        .update({ activo: !rubro.activo })
        .eq('id', rubro.id)

      if (error) throw error

      toast({
        title: "Estado actualizado",
        description: `Rubro ${!rubro.activo ? 'activado' : 'desactivado'} correctamente`
      })

      cargarRubros()

    } catch (error: any) {
      console.error('Error actualizando estado:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const filteredRubros = rubros.filter(rubro =>
    rubro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rubro.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedRubros = filteredRubros.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rubros</h2>
          <p className="text-muted-foreground">Administra los rubros de actividad de los socios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Rubro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rubro</DialogTitle>
              <DialogDescription>
                Agrega un nuevo rubro de actividad para los socios
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
              <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Crear Rubro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de rubros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">Listado de Rubros</CardTitle>
          <CardDescription>Gestiona todos los rubros de actividad disponibles</CardDescription>

          {/* Filtro de búsqueda */}
          <div className="flex gap-4 mt-4">
            <div className="w-64">
              <Label htmlFor="search">Buscar rubro</Label>
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
                <p className="text-muted-foreground">Cargando rubros...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 mb-2">{error}</p>
                <Button onClick={cargarRubros} className="bg-green-600 hover:bg-green-700 text-white">
                  Reintentar
                </Button>
              </div>
            </div>
          ) : rubros.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay rubros registrados</p>
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
                  {paginatedRubros.map((rubro) => (
                    <TableRow key={rubro.id}>
                      <TableCell className="font-medium">{rubro.nombre}</TableCell>
                      <TableCell>{rubro.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={rubro.activo ? "default" : "secondary"}
                          className={rubro.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {rubro.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rubro)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivo(rubro)}
                            className={rubro.activo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            {rubro.activo ? "Desactivar" : "Activar"}
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
                  Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRubros.length)} a {Math.min(currentPage * itemsPerPage, filteredRubros.length)} de {filteredRubros.length} rubros
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
                    Página {currentPage} de {Math.ceil(filteredRubros.length / itemsPerPage)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredRubros.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredRubros.length / itemsPerPage)}
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
            <DialogTitle>Editar Rubro</DialogTitle>
            <DialogDescription>
              Modifica los datos del rubro seleccionado
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
              setSelectedRubro(null)
              resetForm()
            }}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Actualizar Rubro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}