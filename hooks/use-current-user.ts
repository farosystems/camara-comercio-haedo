import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Usuario, Socio } from '@/lib/supabase'

interface CurrentUserData {
  usuario: Usuario | null
  socio: Socio | null
  loading: boolean
  error: string | null
}

export function useCurrentUser(): CurrentUserData {
  const { user: clerkUser, isLoaded } = useUser()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [socio, setSocio] = useState<Socio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCurrentUser() {
      if (!isLoaded || !clerkUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Buscar usuario por clerk_user_id
        const response = await fetch('/api/auth/current-user')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error obteniendo usuario')
        }

        setUsuario(data.usuario)
        setSocio(data.socio)

      } catch (err: any) {
        console.error('Error obteniendo usuario actual:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [clerkUser, isLoaded])

  return {
    usuario,
    socio,
    loading,
    error
  }
}



