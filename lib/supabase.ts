import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Crear una instancia singleton para evitar múltiples GoTrueClient
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const supabase = getSupabaseClient()

export function createClient() {
  return getSupabaseClient()
}

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// Tipos TypeScript basados en el esquema de Supabase
export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono: string | null
  password_hash: string | null
  rol: 'admin' | 'supervisor' | 'socio'
  creado_el: string
  prueba_gratis: boolean
  clerk_user_id: string | null
  status: 'Activo' | 'Inactivo' | 'Bloqueado'
  ultimo_acceso: string | null
  updated_at: string
  socios?: {
    id: number
    razon_social: string
  }[]
}

export interface Modulo {
  id: number
  nombre: string
  descripcion: string | null
  icono: string | null
  ruta: string | null
  activo: boolean
  orden: number
  creado_el: string
}

export interface PermisoUsuario {
  id: number
  fk_id_usuario: number
  fk_id_modulo: number
  puede_ver: boolean
  creado_el: string
  actualizado_el: string
}
