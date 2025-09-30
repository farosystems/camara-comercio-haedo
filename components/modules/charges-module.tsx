"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Cargo,
  getCargos,
  crearCargo,
  actualizarCargo,
  eliminarCargo
} from "@/lib/supabase-admin"

export function ChargesModule() {
  const { toast } = useToast()
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para gestión de cargos
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null)
  const [cargoFormData, setCargoFormData] = useState({
    nombre: '',
    tipo: 'Fijo',
    monto: '',
    descripcion: '',
    frecuencia: 'Mensual',
    activo: true
  })

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarCargos()
  }, [])

  const cargarCargos = async () => {
    try {
      setLoading(true)
      const cargosData = await getCargos()
      setCargos(cargosData)
    } catch (err) {
      console.error('Error cargando cargos:', err)
      setError('Error al cargar los cargos')
      toast({
        title: "Error",
        description: "No se pudieron cargar los cargos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar cargos por término de búsqueda
  const filteredCargos = cargos.filter(cargo => {
    const searchLower = searchTerm.toLowerCase()
    return (
      cargo.nombre.toLowerCase().includes(searchLower) ||
      cargo.descripcion.toLowerCase().includes(searchLower) ||
      cargo.tipo.toLowerCase().includes(searchLower) ||
      cargo.frecuencia.toLowerCase().includes(searchLower)
    )
  })

  // Manejar envío del formulario de cargo
  const handleSubmitCargo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cargoFormData.nombre || !cargoFormData.descripcion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const cargoData = {
        nombre: cargoFormData.nombre,
        tipo: cargoFormData.tipo as 'Fijo' | 'Variable',
        monto: cargoFormData.tipo === 'Fijo' ? parseFloat(cargoFormData.monto) : null,
        descripcion: cargoFormData.descripcion,
        frecuencia: cargoFormData.frecuencia as 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual',
        activo: cargoFormData.activo
      }

      if (selectedCargo) {
        // Actualizar cargo existente
        await actualizarCargo(selectedCargo.id, cargoData)
        toast({
          title: "Cargo actualizado",
          description: "El cargo ha sido actualizado exitosamente",
          variant: "default",
        })
      } else {
        // Crear nuevo cargo
        await crearCargo(cargoData)
        toast({
          title: "Cargo creado",
          description: "El cargo ha sido creado exitosamente",
          variant: "default",
        })
      }

      // Limpiar formulario y cerrar diálogo
      setCargoFormData({
        nombre: '',
        tipo: 'Fijo',
        monto: '',
        descripcion: '',
        frecuencia: 'Mensual',
        activo: true
      })
      setSelectedCargo(null)
      setIsCargoDialogOpen(false)
      setIsEditDialogOpen(false)

      // Recargar datos
      await cargarCargos()

    } catch (err) {
      console.error('Error guardando cargo:', err)
      toast({
        title: "Error",
        description: "No se pudo guardar el cargo",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para editar cargo
  const handleEditCargo = (cargo: Cargo) => {
    setSelectedCargo(cargo)
    setCargoFormData({
      nombre: cargo.nombre,
      tipo: cargo.tipo,
      monto: cargo.monto?.toString() || '',
      descripcion: cargo.descripcion,
      frecuencia: cargo.frecuencia,
      activo: cargo.activo
    })
    setIsEditDialogOpen(true)
  }

  // Abrir diálogo para eliminar cargo
  const handleDeleteCargo = (cargo: Cargo) => {
    setSelectedCargo(cargo)
    setIsDeleteDialogOpen(true)
  }

  // Confirmar eliminación de cargo
  const confirmDeleteCargo = async () => {
    if (!selectedCargo) return

    try {
      await eliminarCargo(selectedCargo.id)

      toast({
        title: "Cargo eliminado",
        description: "El cargo ha sido eliminado exitosamente",
        variant: "default",
      })

      setSelectedCargo(null)
      setIsDeleteDialogOpen(false)
      await cargarCargos()

    } catch (err) {
      console.error('Error eliminando cargo:', err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cargo",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para nuevo cargo
  const handleNewCargo = () => {
    setSelectedCargo(null)
    setCargoFormData({
      nombre: '',
      tipo: 'Fijo',
      monto: '',
      descripcion: '',
      frecuencia: 'Mensual',
      activo: true
    })
    setIsCargoDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cargos Definidos</h2>
          <p className="text-muted-foreground">
            Configuración de cargos fijos y variables para aplicar a los socios
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-orange-700">Gestión de Cargos</CardTitle>
              <CardDescription>Configuración de cargos fijos y variables para aplicar a los socios</CardDescription>
            </div>
            <Button onClick={handleNewCargo} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cargo
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cargos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando cargos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCargos.map((cargo) => (
                  <TableRow key={cargo.id}>
                    <TableCell className="font-medium">{cargo.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={cargo.tipo === 'Fijo' ? 'default' : 'secondary'}>
                        {cargo.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cargo.tipo === 'Fijo' && cargo.monto
                        ? `$${cargo.monto.toLocaleString()}`
                        : 'Variable'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cargo.frecuencia}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={cargo.descripcion}>
                      {cargo.descripcion}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={cargo.activo ? 'default' : 'secondary'}
                        className={cargo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {cargo.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCargo(cargo)}
                          title="Editar cargo"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCargo(cargo)}
                          title="Eliminar cargo"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredCargos.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay cargos</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No se encontraron cargos con ese criterio de búsqueda.' : 'Aún no se han definido cargos en el sistema.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNewCargo} className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer cargo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar cargo */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cargo</DialogTitle>
            <DialogDescription>Define un nuevo tipo de cargo para aplicar a los socios</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCargo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del Cargo *</Label>
                <Input
                  id="nombre"
                  value={cargoFormData.nombre}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Cuota Social Mensual"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={cargoFormData.tipo}
                  onValueChange={(value) => setCargoFormData(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {cargoFormData.tipo === 'Fijo' && (
              <div className="grid gap-2">
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cargoFormData.monto}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select
                value={cargoFormData.frecuencia}
                onValueChange={(value) => setCargoFormData(prev => ({ ...prev, frecuencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={cargoFormData.descripcion}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe el cargo y su propósito..."
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={cargoFormData.activo}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, activo: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="activo">Cargo activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCargoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Crear Cargo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar cargo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Cargo</DialogTitle>
            <DialogDescription>Modifica la información del cargo seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCargo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nombre">Nombre del Cargo *</Label>
                <Input
                  id="edit-nombre"
                  value={cargoFormData.nombre}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Cuota Social Mensual"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select
                  value={cargoFormData.tipo}
                  onValueChange={(value) => setCargoFormData(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {cargoFormData.tipo === 'Fijo' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-monto">Monto *</Label>
                <Input
                  id="edit-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cargoFormData.monto}
                  onChange={(e) => setCargoFormData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-frecuencia">Frecuencia *</Label>
              <Select
                value={cargoFormData.frecuencia}
                onValueChange={(value) => setCargoFormData(prev => ({ ...prev, frecuencia: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <Textarea
                id="edit-descripcion"
                value={cargoFormData.descripcion}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe el cargo y su propósito..."
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-activo"
                checked={cargoFormData.activo}
                onChange={(e) => setCargoFormData(prev => ({ ...prev, activo: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-activo">Cargo activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Actualizar Cargo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cargo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el cargo "{selectedCargo?.nombre}"?
              Esta acción no se puede deshacer y podría afectar los movimientos existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCargo}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}