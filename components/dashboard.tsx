"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Truck, ShoppingCart, DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react"
import { 
  Socio, 
  Proveedor, 
  Pedido,
  getSocios,
  getProveedores,
  getPedidos
} from "@/lib/supabase-admin"

export function Dashboard() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar datos desde Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true)
        const [sociosData, proveedoresData, pedidosData] = await Promise.all([
          getSocios(),
          getProveedores(),
          getPedidos()
        ])
        setSocios(sociosData)
        setProveedores(proveedoresData)
        setPedidos(pedidosData)
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

    // Proveedores
    const totalProveedores = proveedores.length
    const proveedoresMesAnterior = proveedores.filter(prov => {
      const fechaProv = new Date(prov.created_at)
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
      const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual
      return fechaProv.getMonth() === mesAnterior && fechaProv.getFullYear() === añoAnterior
    }).length
    const variacionProveedores = proveedoresMesAnterior > 0 
      ? ((totalProveedores - proveedoresMesAnterior) / proveedoresMesAnterior) * 100 
      : 0

    // Pedidos pendientes
    const pedidosPendientes = pedidos.filter(pedido => pedido.estado === 'Pendiente').length
    const pedidosPendientesMesAnterior = pedidos.filter(pedido => {
      const fechaPedido = new Date(pedido.fecha)
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
      const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual
      return pedido.estado === 'Pendiente' && 
             fechaPedido.getMonth() === mesAnterior && 
             fechaPedido.getFullYear() === añoAnterior
    }).length
    const variacionPedidos = pedidosPendientesMesAnterior > 0 
      ? ((pedidosPendientes - pedidosPendientesMesAnterior) / pedidosPendientesMesAnterior) * 100 
      : 0

    // Saldo total
    const saldoTotal = pedidos.reduce((sum, pedido) => sum + pedido.total, 0)
    const saldoMesAnterior = pedidos.filter(pedido => {
      const fechaPedido = new Date(pedido.fecha)
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1
      const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual
      return fechaPedido.getMonth() === mesAnterior && fechaPedido.getFullYear() === añoAnterior
    }).reduce((sum, pedido) => sum + pedido.total, 0)
    const variacionSaldo = saldoMesAnterior > 0 
      ? ((saldoTotal - saldoMesAnterior) / saldoMesAnterior) * 100 
      : 0

    return {
      sociosActivos,
      variacionSocios,
      totalProveedores,
      variacionProveedores,
      pedidosPendientes,
      variacionPedidos,
      saldoTotal,
      variacionSaldo
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
      title: "Proveedores",
      value: loading ? "..." : statsData.totalProveedores.toString(),
      change: loading ? "..." : `${statsData.variacionProveedores > 0 ? '+' : ''}${statsData.variacionProveedores.toFixed(0)}%`,
      icon: Truck,
      color: "text-green-600",
    },
    {
      title: "Pedidos Pendientes",
      value: loading ? "..." : statsData.pedidosPendientes.toString(),
      change: loading ? "..." : `${statsData.variacionPedidos > 0 ? '+' : ''}${statsData.variacionPedidos.toFixed(0)}%`,
      icon: ShoppingCart,
      color: "text-orange-600",
    },
    {
      title: "Saldo Total",
      value: loading ? "..." : `$${statsData.saldoTotal.toLocaleString()}`,
      change: loading ? "..." : `${statsData.variacionSaldo > 0 ? '+' : ''}${statsData.variacionSaldo.toFixed(0)}%`,
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ]

  // Obtener pedidos recientes (últimos 4)
  const recentOrders = loading ? [] : pedidos
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
    .map(pedido => {
      const socio = socios.find(s => s.id === pedido.fk_id_socio)
      const proveedor = proveedores.find(p => p.id === pedido.fk_id_proveedor)
      return {
        id: pedido.id,
        member: socio?.razon_social || 'Socio no encontrado',
        provider: proveedor?.nombre || 'Proveedor no encontrado',
        amount: `$${pedido.total.toLocaleString()}`,
        status: pedido.estado
      }
    })

  const alerts = [
    { type: "warning", message: "5 socios con saldos vencidos" },
    { type: "info", message: "Nueva lista de precios de Audio Pro disponible" },
    { type: "error", message: "Falla en importación de Excel - Revisar formato" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general del sistema de gestión</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pedido
        </Button>
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
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos pedidos realizados por los socios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Cargando pedidos recientes...
                </div>
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{order.member}</p>
                      <p className="text-xs text-muted-foreground">{order.provider}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{order.amount}</p>
                      <Badge
                        variant={
                          order.status === "Entregado"
                            ? "default"
                            : order.status === "Procesado"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay pedidos recientes
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
