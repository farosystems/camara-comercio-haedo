import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
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
