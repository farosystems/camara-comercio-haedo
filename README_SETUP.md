# 🚀 Configuración del Sistema de Gestión - Mar & Sierras

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en [Clerk](https://clerk.com) para autenticación
- Cuenta en [Supabase](https://supabase.com) para base de datos

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd sistema-gestion
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

### 4. Configurar Clerk

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com)
2. Crea una nueva aplicación
3. En la configuración de la aplicación:
   - **Sign-in URL**: `http://localhost:3000/sign-in`
   - **Sign-up URL**: `http://localhost:3000/sign-up`
   - **After sign-in URL**: `http://localhost:3000/dashboard`
   - **After sign-up URL**: `http://localhost:3000/dashboard`

4. Copia las claves de API a tu `.env.local`

### 5. Configurar Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto
3. Ve a **Settings > API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 6. Ejecutar el script SQL

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido del archivo `supabase_schema.sql`
3. Ejecuta el script

### 7. Ejecutar el proyecto

```bash
npm run dev
```

El sistema estará disponible en `http://localhost:3000`

## 🔐 Configuración de Usuarios

### Usuario Administrador por defecto:
- **Email**: `admin@agrupacion.com`
- **Rol**: `admin`
- **Permisos**: Acceso completo a todos los módulos

### Crear nuevos usuarios:
1. Registra usuarios a través de Clerk (`/sign-up`)
2. Los usuarios se crean automáticamente en la base de datos
3. Configura permisos desde el módulo **Seguridad**

## 📊 Estructura de Módulos

### Módulos Disponibles:
1. **Dashboard** - Panel principal
2. **Socios** - Gestión de socios
3. **Facturación** - Facturación y cobranzas
4. **Proveedores** - Gestión de proveedores
5. **Pedidos** - Gestión de pedidos
6. **Contabilidad** - Cuentas corrientes
7. **Administración** - Configuración del sistema
8. **Seguridad** - Gestión de usuarios y permisos

### Roles de Usuario:
- **admin**: Acceso completo a todos los módulos
- **supervisor**: Acceso limitado según permisos
- **socio**: Acceso limitado según permisos

## 🛡️ Sistema de Permisos

### Permisos por Módulo:
- **Ver**: Acceso de lectura al módulo
- **Crear**: Crear nuevos registros
- **Editar**: Modificar registros existentes
- **Eliminar**: Eliminar registros

### Configuración:
1. Ve al módulo **Seguridad**
2. Selecciona un usuario
3. Configura permisos por módulo
4. Guarda los cambios

## 🔄 Flujo de Autenticación

1. Usuario accede a `/sign-in`
2. Se autentica con Clerk
3. Sistema verifica usuario en Supabase
4. Se cargan permisos del usuario
5. Se muestra sidebar con módulos autorizados
6. RouteGuard protege cada página

## 🚨 Troubleshooting

### Error: "Usuario no encontrado en el sistema"
- Verifica que el usuario existe en la tabla `usuarios`
- Asegúrate de que `clerk_user_id` esté correctamente vinculado

### Error: "Sin permisos para este módulo"
- Verifica permisos en la tabla `permisos_usuarios`
- Asegúrate de que el módulo esté activo en `modulos`

### Error de conexión a Supabase
- Verifica las variables de entorno
- Asegúrate de que el proyecto esté activo en Supabase

## 📝 Notas Importantes

- El sistema usa **Row Level Security (RLS)** en Supabase
- Los administradores tienen acceso completo automáticamente
- Los permisos se verifican en cada página y API route
- El sidebar se actualiza dinámicamente según los permisos del usuario

## 🆘 Soporte

Para problemas técnicos:
1. Revisa los logs del navegador
2. Verifica la consola de Supabase
3. Revisa los logs de Clerk
4. Contacta al administrador del sistema








