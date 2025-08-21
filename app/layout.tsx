import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión",
  description: "Sistema completo para gestión de agrupaciones",
  generator: "v0.app",
  icons: {
    icon: "/images/logo-cooperativa.png",
    shortcut: "/images/logo-cooperativa.png",
    apple: "/images/logo-cooperativa.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/home"
          afterSignUpUrl="/home"
        >
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  )
}
