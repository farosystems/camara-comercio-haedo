"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Users, Calculator, Settings, ChevronLeft, Receipt, Shield, TrendingUp, ChevronDown, DollarSign, Building, Tag, Wallet } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserModules } from "@/hooks/use-permissions"
import { useState } from "react"

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
  submenu?: SubMenuItem[]
}

interface SubMenuItem {
  id: string
  label: string
  icon: any
  href: string
}

// Mapeo de nombres de módulos de la BD a nombres del sidebar
const moduleNameMap: { [key: string]: string } = {
  'DASHBOARD': 'Dashboard',
  'SOCIOS': 'Socios',
  'FACTURACION': 'Gestion de Socios',
  'TESORERIA': 'Tesorería',
  'CAJAS': 'Cajas',
  'CONTABILIDAD': 'Cuentas Corrientes',
  'ADMINISTRACION': 'Administración',
  'SEGURIDAD': 'Seguridad por Usuario'
}

// Mapeo de iconos por nombre del módulo
const iconMap: { [key: string]: any } = {
  'DASHBOARD': Home,
  'SOCIOS': Users,
  'FACTURACION': Receipt,
  'TESORERIA': TrendingUp,
  'CAJAS': Wallet,
  'CONTABILIDAD': Calculator,
  'ADMINISTRACION': Settings,
  'SEGURIDAD': Shield,
}

// Mapeo de rutas por nombre del módulo
const routeMap: { [key: string]: string } = {
  'DASHBOARD': '/modules/dashboard',
  'SOCIOS': '/modules/members',
  'FACTURACION': '/modules/billing',
  'TESORERIA': '/modules/movements',
  'CAJAS': '/modules/cash-box',
  'CONTABILIDAD': '/modules/accounting',
  'ADMINISTRACION': '/modules/admin',
  'SEGURIDAD': '/modules/security'
}

export function Sidebar({ activeModule, setActiveModule, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { modules, loading } = useUserModules()
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({})

  // Toggle dropdown function
  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Filtrar solo los módulos que el usuario puede ver y mapear a nombres originales
  const userMenuItems: MenuItem[] = modules
    .filter((module: any) => module.puede_ver && module.activo)
    .sort((a: any, b: any) => a.orden - b.orden)
    .map((module: any): MenuItem => {
      const baseItem = {
        id: module.id.toString(),
        label: moduleNameMap[module.nombre] || module.nombre,
        icon: iconMap[module.nombre] || Home,
        href: routeMap[module.nombre] || module.ruta || '/home'
      }

      // Add submenu for billing module
      if (module.nombre === 'FACTURACION') {
        return {
          ...baseItem,
          submenu: [
            {
              id: 'billing-charges',
              label: 'Cargos Definidos',
              icon: DollarSign,
              href: '/billing/charges'
            },
            {
              id: 'billing-movements',
              label: 'Gestion de cuotas',
              icon: TrendingUp,
              href: '/billing/movements'
            },
            {
              id: 'billing-accounts',
              label: 'Estado de Socios',
              icon: Users,
              href: '/billing/accounts'
            },
            {
              id: 'billing-reports',
              label: 'Resumen global',
              icon: Calculator,
              href: '/billing/reports'
            }
          ]
        }
      }

      // Add submenu for members module
      if (module.nombre === 'SOCIOS') {
        return {
          ...baseItem,
          submenu: [
            {
              id: 'members-list',
              label: 'Gestión de Socios',
              icon: Users,
              href: '/members/list'
            },
            {
              id: 'members-types',
              label: 'Tipos de Comercio',
              icon: Building,
              href: '/members/types'
            },
            {
              id: 'members-categories',
              label: 'Rubros',
              icon: Tag,
              href: '/members/categories'
            }
          ]
        }
      }

      return baseItem
    })

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-16",
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
                alt="Cooperativa"
                fill
                className="object-contain"
              />
            </div>
            {isOpen && <span className="font-semibold text-sidebar-foreground">Camara-Haedo</span>}
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
                const hasSubmenu = item.submenu && item.submenu.length > 0
                const isDropdownOpen = openDropdowns[item.id]
                const isDirectlyActive = pathname === item.href
                const hasActiveSubmenu = hasSubmenu && item.submenu?.some(sub => pathname === sub.href)

                return (
                  <div key={item.id} className="space-y-1">
                    {hasSubmenu ? (
                      // Dropdown menu item
                      <Button
                        variant="ghost"
                        onClick={() => toggleDropdown(item.id)}
                        className={cn(
                          "w-full justify-between gap-3 h-10",
                          hasActiveSubmenu
                            ? "text-blue-600 hover:bg-sidebar-accent hover:text-blue-700"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          !isOpen && "justify-center px-2",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {isOpen && <span className="truncate">{item.label}</span>}
                        </div>
                        {isOpen && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isDropdownOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Button>
                    ) : (
                      // Regular menu item
                      <Link href={item.href}>
                        <Button
                          variant={isDirectlyActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-10",
                            isDirectlyActive
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            !isOpen && "justify-center px-2",
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {isOpen && <span className="truncate">{item.label}</span>}
                        </Button>
                      </Link>
                    )}

                    {/* Submenu items */}
                    {hasSubmenu && isDropdownOpen && isOpen && (
                      <div className="ml-6 space-y-1">
                        {item.submenu?.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = pathname === subItem.href

                          return (
                            <Link key={subItem.id} href={subItem.href}>
                              <Button
                                variant={isSubActive ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "w-full justify-start gap-2 h-8 text-xs",
                                  isSubActive
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                )}
                              >
                                <SubIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{subItem.label}</span>
                              </Button>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}
