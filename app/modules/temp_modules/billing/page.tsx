"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BillingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to movements by default
    router.replace('/billing/movements')
  }, [router])

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirigiendo a Movimientos...</p>
      </div>
    </div>
  )
}






