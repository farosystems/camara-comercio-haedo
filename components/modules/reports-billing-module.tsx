"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  MovimientoSocio,
  Socio,
  Factura,
  Cargo,
  getMovimientosSocios,
  getSocios,
  getFacturas,
  getCargos
} from "@/lib/supabase-admin"

export function ReportsBillingModule() {
  const { toast } = useToast()
  const [movements, setMovements] = useState<MovimientoSocio[]>([])
  const [members, setMembers] = useState<Socio[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros de fecha
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Cargar datos desde Supabase
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [movementsData, membersData, facturasData, cargosData] = await Promise.all([
        getMovimientosSocios(),
        getSocios(),
        getFacturas(),
        getCargos()
      ])
      setMovements(movementsData)
      setMembers(membersData)
      setFacturas(facturasData)
      setCargos(cargosData)
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

  // Filtrar movimientos por rango de fechas
  const filteredMovements = movements.filter(movement => {
    if (!startDate && !endDate) return true

    const movementDate = new Date(movement.fecha)
    let matchesDateRange = true

    if (startDate) {
      const start = new Date(startDate)
      matchesDateRange = matchesDateRange && movementDate >= start
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // Include the entire end date
      matchesDateRange = matchesDateRange && movementDate <= end
    }

    return matchesDateRange
  })

  // Calculadores de métricas basados en movimientos filtrados
  const cuotasCobradas = filteredMovements.filter(m => m.tipo === "Cargo" && m.estado === "Cobrada").length
  const cuotasPendientesYVencidas = filteredMovements.filter(m => m.tipo === "Cargo" && (m.estado === "Pendiente" || m.estado === "Vencida")).length
  const cuotasVencidas = filteredMovements.filter(m => m.tipo === "Cargo" && m.estado === "Vencida").length

  // Socios con cuotas vencidas hace más de 2 meses
  const fechaLimite = new Date()
  fechaLimite.setMonth(fechaLimite.getMonth() - 2)

  const sociosConCuotasVencidasAntiguas = members.filter(member => {
    const cuotasVencidasAntiguas = filteredMovements.filter(m =>
      m.fk_id_socio === member.id &&
      m.tipo === "Cargo" &&
      m.estado === "Vencida" &&
      m.fecha_vencimiento &&
      new Date(m.fecha_vencimiento) < fechaLimite
    )
    return cuotasVencidasAntiguas.length > 0
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resumen global</h2>
          <p className="text-muted-foreground">
            Análisis y estadísticas del proceso de facturación
          </p>
        </div>
        <div className="flex gap-4 items-end">
          {/* Filtro por Fecha Desde */}
          <div className="w-40">
            <Label htmlFor="start-date">Fecha Desde</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Filtro por Fecha Hasta */}
          <div className="w-40">
            <Label htmlFor="end-date">Fecha Hasta</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Botón para limpiar filtros */}
          {(startDate || endDate) && (
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("")
                setEndDate("")
              }}
            >
              Limpiar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Indicador de filtro activo */}
      {(startDate || endDate) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Filtro activo:
              {startDate && endDate ? (
                `Desde ${new Date(startDate).toLocaleDateString('es-AR')} hasta ${new Date(endDate).toLocaleDateString('es-AR')}`
              ) : startDate ? (
                `Desde ${new Date(startDate).toLocaleDateString('es-AR')}`
              ) : (
                `Hasta ${new Date(endDate).toLocaleDateString('es-AR')}`
              )}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando reportes...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cuotas Cobradas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {cuotasCobradas}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuotas cobradas exitosamente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cuotas Pendientes y Vencidas</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {cuotasPendientesYVencidas}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuotas por cobrar o vencidas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cuotas Vencidas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {cuotasVencidas}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuotas vencidas sin cobrar
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Socios con Cuotas Vencidas (+2 meses)</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {sociosConCuotasVencidasAntiguas.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Socios con deudas antiguas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Card detallada de socios con cuotas vencidas hace más de 2 meses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Socios con Cuotas Vencidas hace más de 2 meses
              </CardTitle>
              <CardDescription>
                Lista de socios que tienen cuotas vencidas con más de 2 meses de antigüedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sociosConCuotasVencidasAntiguas.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay socios con cuotas vencidas hace más de 2 meses</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sociosConCuotasVencidasAntiguas.map((member) => {
                    const cuotasVencidasAntiguas = filteredMovements.filter(m =>
                      m.fk_id_socio === member.id &&
                      m.tipo === "Cargo" &&
                      m.estado === "Vencida" &&
                      m.fecha_vencimiento &&
                      new Date(m.fecha_vencimiento) < fechaLimite
                    )
                    const totalDeuda = cuotasVencidasAntiguas.reduce((sum, m) => sum + m.saldo, 0)

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{member.razon_social}</p>
                          <p className="text-xs text-muted-foreground">CUIT: {member.cuit}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {cuotasVencidasAntiguas.length} cuota{cuotasVencidasAntiguas.length !== 1 ? 's' : ''} vencida{cuotasVencidasAntiguas.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">${totalDeuda.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground">Deuda total</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </>
      )}
    </div>
  )
}