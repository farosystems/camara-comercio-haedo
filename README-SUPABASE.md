# Configuración de Supabase - Sistema de Gestión

## 📋 Pasos para configurar la base de datos

### 1. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota las credenciales:
   - URL del proyecto
   - Anon Key (clave pública)

### 2. Configurar variables de entorno
Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Ejecutar el esquema de base de datos
1. Ve al **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido del archivo `supabase_schema.sql`
3. Ejecuta el script completo

### 4. Insertar datos de ejemplo
1. En el **SQL Editor** de Supabase
2. Copia y pega el contenido del archivo `scripts/insert-sample-data.sql`
3. Ejecuta el script

### 5. Configurar usuarios de prueba
1. Ve a la tabla `usuarios` en Supabase
2. Actualiza el `clerk_user_id` del usuario administrador con tu ID de Clerk
3. Crea permisos en la tabla `permisos_usuarios` para los módulos que quieras probar

## 🗄️ Estructura de la base de datos

### Tablas principales:
- **usuarios** - Usuarios del sistema
- **modulos** - Módulos disponibles
- **permisos_usuarios** - Permisos por usuario
- **socios** - Socios de la agrupación
- **proveedores** - Proveedores
- **productos** - Productos disponibles
- **listas_precios** - Listas de precios
- **condiciones_compra** - Condiciones comerciales
- **cargos** - Tipos de cargos
- **movimientos_socios** - Movimientos financieros
- **pedidos** - Pedidos a proveedores
- **facturas** - Facturas emitidas
- **pagos** - Pagos registrados

## 🔧 Funciones disponibles

### Módulos integrados:
- ✅ **Admin** - Gestión de usuarios
- ✅ **Socios** - Gestión de socios
- ✅ **Proveedores** - Gestión de proveedores y productos
- ✅ **Facturación** - Cargos y movimientos
- ✅ **Pedidos** - Gestión de pedidos
- ✅ **Contabilidad** - Facturas y pagos

### Funciones de Supabase:
- `getUsuarios()` - Obtener todos los usuarios
- `getSocios()` - Obtener todos los socios
- `getProveedores()` - Obtener todos los proveedores
- `getProductos()` - Obtener todos los productos
- `getCargos()` - Obtener todos los cargos
- `getMovimientosSocios()` - Obtener movimientos
- `getFacturas()` - Obtener facturas
- `getPagos()` - Obtener pagos

## 🚀 Próximos pasos

1. **Ejecutar los scripts SQL** en Supabase
2. **Configurar las variables de entorno**
3. **Probar la aplicación** con los datos de ejemplo
4. **Personalizar** según las necesidades específicas

## 📝 Notas importantes

- Todos los módulos ahora cargan datos reales de Supabase
- Los datos de ejemplo incluyen 4 socios, 4 proveedores, 6 productos, etc.
- El sistema maneja estados de loading y errores
- Los permisos se gestionan a través de la tabla `permisos_usuarios`








