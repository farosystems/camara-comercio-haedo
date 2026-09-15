import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const CLERK_USER_ID = 'user_3JNO_iuTcrGYp1' // El user ID que vimos en Clerk

async function seedDatabase() {
  console.log('🌱 Iniciando seed de la base de datos...\n')

  // 1. Crear módulos
  console.log('📦 Creando módulos...')
  const modulos = [
    { nombre: 'DASHBOARD', descripcion: 'Panel principal del sistema', ruta: '/modules/dashboard', activo: true, orden: 1 },
    { nombre: 'SOCIOS', descripcion: 'Gestión de socios', ruta: '/modules/members/list', activo: true, orden: 2 },
    { nombre: 'FACTURACION', descripcion: 'Facturación a socios', ruta: '/modules/billing/movements', activo: true, orden: 3 },
    { nombre: 'MOVIMIENTOS', descripcion: 'Movimientos de caja', ruta: '/modules/movements', activo: true, orden: 4 },
    { nombre: 'CAJAS', descripcion: 'Apertura y cierre de cajas', ruta: '/modules/cash-box', activo: true, orden: 5 },
    { nombre: 'CONTABILIDAD', descripcion: 'Cuentas corrientes', ruta: '/modules/accounting', activo: true, orden: 6 },
    { nombre: 'ADMINISTRACION', descripcion: 'Administración del sistema', ruta: '/modules/admin', activo: true, orden: 7 },
    { nombre: 'SEGURIDAD', descripcion: 'Seguridad por usuario', ruta: '/modules/security', activo: true, orden: 8 },
  ]

  const { data: modulosCreados, error: errorModulos } = await supabase
    .from('modulos')
    .upsert(modulos, { onConflict: 'nombre' })
    .select()

  if (errorModulos) {
    console.error('❌ Error creando módulos:', errorModulos)
  } else {
    console.log(`✅ ${modulosCreados?.length || 0} módulos creados\n`)
  }

  // 2. Crear usuario administrador
  console.log('👤 Creando usuario administrador...')
  const { data: usuarioExistente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('clerk_user_id', CLERK_USER_ID)
    .single()

  if (usuarioExistente) {
    console.log('⚠️  Usuario ya existe, actualizando rol a admin...')
    const { error: errorUpdate } = await supabase
      .from('usuarios')
      .update({ rol: 'admin', status: 'Activo' })
      .eq('clerk_user_id', CLERK_USER_ID)

    if (errorUpdate) {
      console.error('❌ Error actualizando usuario:', errorUpdate)
    } else {
      console.log('✅ Usuario actualizado a admin\n')
    }
  } else {
    const { data: nuevoUsuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .insert({
        nombre: 'Administrador',
        email: 'admin@agrupacion.com',
        clerk_user_id: CLERK_USER_ID,
        rol: 'admin',
        status: 'Activo',
        prueba_gratis: false
      })
      .select()
      .single()

    if (errorUsuario) {
      console.error('❌ Error creando usuario:', errorUsuario)
    } else {
      console.log('✅ Usuario administrador creado:', nuevoUsuario.email, '\n')
    }
  }

  // 3. Verificar que todo esté bien
  console.log('🔍 Verificando datos...')
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, email, clerk_user_id, rol, status')

  const { data: modulosVerificados } = await supabase
    .from('modulos')
    .select('id, nombre, activo')
    .eq('activo', true)

  console.log('\n📊 RESUMEN:')
  console.log('Usuarios:', usuarios?.length || 0)
  console.table(usuarios)
  console.log('\nMódulos activos:', modulosVerificados?.length || 0)
  console.table(modulosVerificados)

  console.log('\n✅ Seed completado!')
}

seedDatabase().catch(console.error)
