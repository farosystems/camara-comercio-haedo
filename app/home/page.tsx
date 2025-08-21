"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Truck, Users, ShoppingCart, Calculator, Settings, Receipt, Shield, ArrowRight } from "lucide-react"

interface Module {
  id: number
  nombre: string
  descripcion: string | null
  ruta: string | null
  puede_ver: boolean
  activo: boolean
  orden: number
}

export default function HomePage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/user/modules')
        if (response.ok) {
          const data = await response.json()
          console.log('Módulos cargados:', data)
          setModules(data)
        }
      } catch (error) {
        console.error('Error fetching modules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [])

  // Mapeo de nombres y iconos
  const moduleNameMap: { [key: string]: string } = {
    'DASHBOARD': 'Dashboard',
    'SOCIOS': 'Socios',
    'FACTURACION': 'Facturación a Socios',
    'PROVEEDORES': 'Proveedores',
    'PEDIDOS': 'Pedidos',
    'CONTABILIDAD': 'Cuentas Corrientes',
    'ADMINISTRACION': 'Administración',
    'SEGURIDAD': 'Seguridad por Usuario'
  }

  const iconMap: { [key: string]: any } = {
    'DASHBOARD': Home,
    'SOCIOS': Users,
    'FACTURACION': Receipt,
    'PROVEEDORES': Truck,
    'PEDIDOS': ShoppingCart,
    'CONTABILIDAD': Calculator,
    'ADMINISTRACION': Settings,
    'SEGURIDAD': Shield,
  }

  const routeMap: { [key: string]: string } = {
    'DASHBOARD': '/dashboard',
    'SOCIOS': '/members',
    'FACTURACION': '/billing',
    'PROVEEDORES': '/providers',
    'PEDIDOS': '/orders',
    'CONTABILIDAD': '/accounting',
    'ADMINISTRACION': '/admin',
    'SEGURIDAD': '/security'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando módulos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Bienvenido al Sistema</h1>
        <p className="text-xl text-muted-foreground">Selecciona el módulo al que deseas acceder</p>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules
          .filter(module => module.puede_ver && module.activo)
          .sort((a, b) => a.orden - b.orden)
          .map((module) => {
            const Icon = iconMap[module.nombre] || Home
            const route = routeMap[module.nombre] || module.ruta || '/dashboard'
            console.log('Módulo:', module.nombre, 'Ruta mapeada:', routeMap[module.nombre], 'Ruta final:', route)
            const label = moduleNameMap[module.nombre] || module.nombre

            return (
              <div 
                key={module.id} 
                onClick={() => {
                  console.log('Navegando a:', route, 'para módulo:', module.nombre)
                  router.push(route)
                }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 hover:border-black">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-200">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{label}</CardTitle>
                    {module.descripcion && (
                      <CardDescription className="text-sm">
                        {module.descripcion}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors duration-200"
                    >
                      Acceder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
      </div>

      {/* Información adicional */}
      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Sistema de Gestión</CardTitle>
            <CardDescription>
              Plataforma completa para la gestión de agrupaciones musicales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-2xl text-blue-600">127</div>
                <div className="text-muted-foreground">Socios Activos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-green-600">23</div>
                <div className="text-muted-foreground">Proveedores</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-orange-600">45</div>
                <div className="text-muted-foreground">Pedidos Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
