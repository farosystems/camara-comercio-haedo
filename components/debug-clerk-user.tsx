"use client"

import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function DebugClerkUser() {
  const { user } = useUser()

  const handleGetUserId = () => {
    if (user) {
      console.log('Clerk User ID:', user.id)
      console.log('Clerk User Email:', user.emailAddresses[0]?.emailAddress)
      console.log('Clerk User Full:', user)
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(user.id)
      alert(`ID copiado al portapapeles: ${user.id}`)
    } else {
      console.log('No hay usuario logueado')
      alert('No hay usuario logueado')
    }
  }

  if (!user) {
    return <div className="text-red-500">No hay usuario logueado</div>
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Debug Clerk User</h3>
      <div className="space-y-2 text-sm">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
        <p><strong>Nombre:</strong> {user.fullName}</p>
      </div>
      <Button onClick={handleGetUserId} className="mt-2">
        Copiar ID al Portapapeles
      </Button>
    </div>
  )
}


