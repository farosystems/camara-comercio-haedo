import { clerkClient } from '@clerk/clerk-sdk-node'

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!

async function checkInstanceConfig() {
  console.log('🔍 Verificando configuración de la instancia de Clerk...\n')

  try {
    // Intentar obtener la configuración de la instancia
    // @ts-ignore - Esta API puede no estar documentada
    const instance = await clerkClient.instances?.getInstance?.()

    if (instance) {
      console.log('📦 Configuración de la instancia:', JSON.stringify(instance, null, 2))
    } else {
      console.log('⚠️  No se pudo obtener la configuración de la instancia')
    }

    // Verificar usuarios con 2FA
    const users = await clerkClient.users.getUserList()
    const usersArray = Array.isArray(users) ? users : users.data || users

    console.log('\n📊 Resumen de usuarios y 2FA:')
    for (const user of usersArray) {
      console.log(`\n👤 ${user.username || user.emailAddresses[0]?.emailAddress}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   twoFactorEnabled: ${user.twoFactorEnabled}`)
      console.log(`   totpEnabled: ${user.totpEnabled}`)
      console.log(`   backupCodeEnabled: ${user.backupCodeEnabled}`)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.errors) {
      console.error('Detalles:', JSON.stringify(error.errors, null, 2))
    }
  }
}

checkInstanceConfig().catch(console.error)
