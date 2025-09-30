"use client"

import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { UserButton } from "@clerk/nextjs"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Sistema de Gestión</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Button de Clerk */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
                userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg rounded-lg",
                userButtonPopoverActionButton: "hover:bg-gray-50 text-gray-700 text-sm",
                userButtonPopoverActionButtonText: "text-gray-700",
                userButtonPopoverFooter: "border-gray-100"
              }
            }}
            afterSignOutUrl="/sign-in"
          />
        </div>
      </div>
    </header>
  )
}
