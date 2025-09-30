import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('API route iniciada')
    
    const { userId } = auth()
    console.log('Auth completado, userId:', userId)
    
    if (!userId) {
      console.log('No hay userId, retornando 401')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('Clerk User ID:', userId)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    console.log('Supabase URL:', supabaseUrl ? 'Configurada' : 'No configurada')
    console.log('Supabase Key:', supabaseKey ? 'Configurada' : 'No configurada')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Cliente Supabase creado')
    
    // Buscar el usuario en nuestra tabla de usuarios usando el clerk_user_id
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('Usuario no encontrado en tabla usuarios para clerk_user_id:', userId)
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      console.error('Error buscando usuario:', userError)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
    
    console.log('Usuario encontrado:', usuario)
    return NextResponse.json(usuario)
    
  } catch (error) {
    console.error('Error en API route:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
