import { clerkClient } from '@clerk/clerk-sdk-node'

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!

async function checkClerkUsers() {
  console.log('🔍 Verificando usuarios en Clerk...\n')

  try {
    // Obtener todos los usuarios
    const response = await clerkClient.users.getUserList()

    console.log('📦 Response completo:', JSON.stringify(response, null, 2))

    // La respuesta puede ser directamente un array o tener estructura data/totalCount
    const users = Array.isArray(response) ? response : (response.data || response)
    const totalCount = Array.isArray(response) ? response.length : (response.totalCount || users.length)

    console.log(`📊 Total de usuarios: ${totalCount}\n`)

    for (const user of users) {
      console.log('👤 Usuario:', user.username || user.emailAddresses[0]?.emailAddress)
      console.log('   ID:', user.id)
      console.log('   Email:', user.emailAddresses[0]?.emailAddress)
      console.log('   Username:', user.username)
      console.log('   Created:', new Date(user.createdAt).toLocaleString())

      // Ver si tiene 2FA habilitado
      console.log('   🔐 Two Factor Enabled:', user.twoFactorEnabled)

      if (user.twoFactorEnabled) {
        console.log('   ⚠️  ESTE USUARIO TIENE 2FA HABILITADO')
        console.log('   Backup codes:', user.backupCodeEnabled)
        console.log('   TOTP:', user.totpEnabled)
      }

      console.log('')
    }

    // Verificar configuración global de la aplicación
    console.log('\n🔧 Verificando configuración de la aplicación...')

    // Intentar obtener configuración de sesiones
    const sessionConfig = await clerkClient.sessions.getSessionList()
    console.log('Sesiones activas:', sessionConfig.totalCount)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Detalles:', error)
  }
}

checkClerkUsers().catch(console.error)
