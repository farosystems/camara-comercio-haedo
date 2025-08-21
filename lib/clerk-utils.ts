export interface Usuario {
  id: number
  email: string
  rol: string
  clerk_user_id: string
  created_at: string
  updated_at: string
}

// Función para obtener el usuario actual desde la API
export async function getCurrentUser(): Promise<Usuario | null> {
  try {
    console.log('Obteniendo usuario actual desde API...')
    
    const response = await fetch('/api/user/current', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Usuario no encontrado en la base de datos')
        return null
      }
      console.error('Error en la respuesta de la API:', response.status, response.statusText)
      return null
    }
    
    const usuario = await response.json()
    console.log('Usuario encontrado:', usuario)
    return usuario
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return null
  }
}
