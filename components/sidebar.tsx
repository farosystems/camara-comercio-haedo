"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Truck, Users, ShoppingCart, Calculator, Settings, ChevronLeft, Receipt, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserModules } from "@/hooks/use-permissions"

interface SidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  href: string
}

// Mapeo de nombres de módulos de la BD a nombres del sidebar
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

// Mapeo de iconos por nombre del módulo
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

// Mapeo de rutas por nombre del módulo
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

export function Sidebar({ activeModule, setActiveModule, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { modules, loading } = useUserModules()

  // Filtrar solo los módulos que el usuario puede ver y mapear a nombres originales
  const userMenuItems: MenuItem[] = modules
    .filter((module: any) => module.puede_ver && module.activo)
    .sort((a: any, b: any) => a.orden - b.orden)
    .map((module: any): MenuItem => ({
      id: module.id.toString(),
      label: moduleNameMap[module.nombre] || module.nombre, // Usar nombre mapeado o original
      icon: iconMap[module.nombre] || Home,
      href: routeMap[module.nombre] || module.ruta || '/home' // Usar ruta mapeada o la de la BD
    }))

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
      )}
      style={{ 
        borderRightWidth: '1px',
        backgroundColor: 'var(--sidebar)',
        borderRightColor: 'var(--sidebar-border)'
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-sidebar-border" 
          style={{ 
            borderBottomWidth: '1px',
            borderBottomColor: 'var(--sidebar-border)'
          }}
        >
          <div className={cn("flex items-center gap-2", !isOpen && "justify-center")}>
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src="/images/logo-cooperativa.png"
                alt="Cooperativa Mar & Sierras"
                fill
                className="object-contain"
              />
            </div>
            {isOpen && <span className="font-semibold text-sidebar-foreground">Mar & Sierras</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !isOpen && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {loading ? (
              // Estado de carga
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sidebar-foreground"></div>
              </div>
            ) : (
              userMenuItems.map((item: MenuItem) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        isActive
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        !isOpen && "justify-center px-2",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </Button>
                  </Link>
                )
              })
            )}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}
