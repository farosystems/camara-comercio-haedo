# Configuración de Supabase

## Pasos para configurar Supabase:

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL del proyecto y la clave anónima

### 2. Configurar variables de entorno
Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Ejecutar el script SQL
1. Ve al panel de Supabase
2. Ve a "SQL Editor"
3. Copia y pega el contenido del archivo `supabase_schema.sql`
4. Ejecuta el script

### 4. Verificar la configuración
Una vez configurado, el módulo de administración debería mostrar datos reales de la base de datos.

## Datos de ejemplo incluidos:
- Usuario administrador por defecto
- Módulos del sistema
- Configuraciones básicas
- Cargos por defecto
- Condiciones de compra

## Nota:
Si las variables de entorno no están configuradas, el sistema usará datos de ejemplo para demostración.





