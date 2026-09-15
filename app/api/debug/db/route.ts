import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    const result: any = {
      config: {
        supabaseUrl: supabaseUrl ? 'Configurada' : 'NO CONFIGURADA',
        supabaseKey: supabaseKey ? 'Configurada' : 'NO CONFIGURADA'
      }
    }

    // 1. Ver todos los usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, clerk_user_id, rol, status, nombre')

    if (usuariosError) {
      result.usuarios = { error: usuariosError.message }
    } else {
      result.usuarios = usuarios
    }

    // 2. Ver todos los módulos
    const { data: modulos, error: modulosError } = await supabase
      .from('modulos')
      .select('id, nombre, activo, orden')
      .order('orden')

    if (modulosError) {
      result.modulos = { error: modulosError.message }
    } else {
      result.modulos = modulos
    }

    // 3. Ver permisos de usuarios
    const { data: permisos, error: permisosError } = await supabase
      .from('permisos_usuarios')
      .select('*')

    if (permisosError) {
      result.permisos = { error: permisosError.message }
    } else {
      result.permisos = permisos || []
    }

    // 4. Buscar usuario con clerk_user_id específico
    const { data: usuarioClerk, error: clerkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_user_id', 'user_3JNO_iuTcrGYp1')
      .maybeSingle()

    if (clerkError) {
      result.usuarioClerk = { error: clerkError.message }
    } else {
      result.usuarioClerk = usuarioClerk || 'No encontrado'
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
