"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { usePathname } from "next/navigation"

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeModule, setActiveModule] = useState("dashboard")
  const pathname = usePathname()

  // Detectar automáticamente el módulo activo basado en la ruta
  useEffect(() => {
    const moduleMap: { [key: string]: string } = {
      "/dashboard": "dashboard",
      "/members": "members",
      "/billing": "billing",
      "/movements": "movements",
      "/accounting": "accounting",
      "/admin": "admin",
      "/security": "security",
    }
    
    const currentModule = moduleMap[pathname] || "dashboard"
    setActiveModule(currentModule)
  }, [pathname])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen bg-background">
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
