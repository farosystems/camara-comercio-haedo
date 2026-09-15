import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl ? 'Configurada' : 'NO CONFIGURADA')
console.log('Supabase Key:', supabaseKey ? 'Configurada' : 'NO CONFIGURADA')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDatabase() {
  console.log('=== DEBUG DATABASE ===\n')

  // 1. Ver todos los usuarios
  console.log('1. USUARIOS:')
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, email, clerk_user_id, rol, status, nombre')

  if (usuariosError) {
    console.error('Error:', usuariosError)
  } else {
    console.table(usuarios)
  }

  console.log('\n')

  // 2. Ver todos los módulos
  console.log('2. MÓDULOS:')
  const { data: modulos, error: modulosError } = await supabase
    .from('modulos')
    .select('id, nombre, activo, orden')
    .order('orden')

  if (modulosError) {
    console.error('Error:', modulosError)
  } else {
    console.table(modulos)
  }

  console.log('\n')

  // 3. Ver permisos de usuarios
  console.log('3. PERMISOS USUARIOS:')
  const { data: permisos, error: permisosError } = await supabase
    .from('permisos_usuarios')
    .select('*')

  if (permisosError) {
    console.error('Error:', permisosError)
  } else {
    if (permisos && permisos.length > 0) {
      console.table(permisos)
    } else {
      console.log('(Tabla vacía)')
    }
  }

  console.log('\n')

  // 4. Buscar usuario con clerk_user_id específico
  console.log('4. BUSCAR USUARIO CON CLERK_USER_ID = user_3JNO_iuTcrGYp1:')
  const { data: usuarioClerk, error: clerkError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('clerk_user_id', 'user_3JNO_iuTcrGYp1')
    .single()

  if (clerkError) {
    console.error('Error:', clerkError)
  } else {
    console.log(usuarioClerk)
  }
}

debugDatabase().catch(console.error)
