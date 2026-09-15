import * as fs from 'fs'
import * as path from 'path'

const files = [
  'app/api/lotes-operaciones/cerrar/route.ts',
  'app/api/lotes-operaciones/route.ts',
  'app/api/user/current/route.ts',
  'app/api/usuarios/current/route.ts',
  'app/api/setup-user/route.ts',
  'app/api/pagos/anular/[id]/route.ts',
  'app/api/movimientos-caja/transferencia/route.ts',
  'app/api/movimientos-caja/route.ts',
  'app/api/movements/process-payment/route.ts',
  'app/api/detalle-lotes/route.ts',
  'app/api/debug/user/route.ts',
  'app/api/clerk/create-user/route.ts',
  'app/api/auth/current-user/route.ts',
  'app/api/auth/delete-user/route.ts',
  'app/api/auth/change-password/route.ts',
]

console.log('🔧 Agregando dynamic = force-dynamic a las rutas de API...\n')

for (const file of files) {
  const filePath = path.join(process.cwd(), file)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${file}`)
    continue
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  // Verificar si ya tiene la configuración
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`✅ ${file} - Ya tiene la configuración`)
    continue
  }

  // Buscar la primera línea de export function o export async function
  const lines = content.split('\n')
  let insertIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/)) {
      insertIndex = i
      break
    }
  }

  if (insertIndex === -1) {
    console.log(`⚠️  ${file} - No se encontró función export`)
    continue
  }

  // Insertar la línea antes de la función
  lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic'", '')

  const newContent = lines.join('\n')
  fs.writeFileSync(filePath, newContent, 'utf-8')

  console.log(`✅ ${file} - Configuración agregada`)
}

console.log('\n✅ Proceso completado')
