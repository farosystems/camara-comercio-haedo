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
    // Extraer el módulo base de la ruta (ej: /modules/members/list -> members)
    const pathParts = pathname.split('/').filter(Boolean)

    if (pathParts.length >= 2 && pathParts[0] === 'modules') {
      setActiveModule(pathParts[1])
    } else if (pathParts.length >= 1) {
      setActiveModule(pathParts[0])
    } else {
      setActiveModule("dashboard")
    }
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
