"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Truck, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { 
  Socio, 
  getSocios
} from "@/lib/supabase-admin"

export function Dashboard() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const sociosData = await getSocios()
        setSocios(sociosData)
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Calcular estadísticas reales
  const calcularEstadisticas = () => {
    const ahora = new Date()
    const mesActual = ahora.getMonth()
    const añoActual = ahora.getFullYear()

    // Socios activos
    const sociosActivos = socios.filter(socio => socio.status === 'Activo').length
    const sociosMesAnterior = socios.filter(socio => {
      const fechaSocio = new Date(socio.created_at)
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
      const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual
      return fechaSocio.getMonth() === mesAnterior && fechaSocio.getFullYear() === añoAnterior
    }).length
    const variacionSocios = sociosMesAnterior > 0 
      ? ((sociosActivos - sociosMesAnterior) / sociosMesAnterior) * 100 
      : 0

    // Estadísticas básicas de socios
    const totalSocios = socios.length

    return {
      sociosActivos,
      variacionSocios,
      totalSocios
    }
  }

  const statsData = calcularEstadisticas()

  const stats = [
    {
      title: "Socios Activos",
      value: loading ? "..." : statsData.sociosActivos.toString(),
      change: loading ? "..." : `${statsData.variacionSocios > 0 ? '+' : ''}${statsData.variacionSocios.toFixed(0)}%`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Socios",
      value: loading ? "..." : statsData.totalSocios.toString(),
      change: loading ? "..." : "0%",
      icon: Users,
      color: "text-green-600",
    },
  ]

  // Obtener socios recientes (últimos 4)
  const recentSocios = loading ? [] : socios
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
    .map(socio => ({
      id: socio.id,
      member: socio.razon_social,
      email: socio.email,
      status: socio.status
    }))

  const alerts = [
    { type: "warning", message: "5 socios con cuotas vencidas" },
    { type: "info", message: "Nuevos productos agregados al catálogo" },
    { type: "error", message: "Error en sincronización de datos - Revisar conexión" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general del sistema de gestión</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} desde el mes pasado
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle>Socios Recientes</CardTitle>
            <CardDescription>Últimos socios registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Cargando socios recientes...
                </div>
              ) : recentSocios.length > 0 ? (
                recentSocios.map((socio) => (
                  <div key={socio.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{socio.member}</p>
                      <p className="text-xs text-muted-foreground">{socio.email}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          socio.status === "Activo"
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {socio.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay socios recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas y Notificaciones</CardTitle>
            <CardDescription>Elementos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertCircle
                    className={`h-4 w-4 mt-0.5 ${
                      alert.type === "error"
                        ? "text-red-500"
                        : alert.type === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                    }`}
                  />
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
