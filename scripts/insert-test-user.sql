-- =====================================================
-- SCRIPT PARA INSERTAR USUARIO DE PRUEBA
-- =====================================================

-- Primero, necesitamos obtener el Clerk User ID del usuario logueado
-- Puedes obtenerlo desde la consola del navegador ejecutando:
-- console.log('Clerk User ID:', await window.Clerk.user?.id)

-- Insertar el usuario de Clerk en la tabla usuarios
INSERT INTO usuarios (email, rol, clerk_user_id, status, created_at, updated_at)
VALUES (
  'socio2@gmail.com',  -- Email del usuario
  'socio',             -- Rol del usuario
  'user_31YQQ91CNo83prvw2lF3jBCv8Km',  -- Clerk User ID del debug
  'Activo',
  NOW(),
  NOW()
)
ON CONFLICT (clerk_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  rol = EXCLUDED.rol,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Obtener el ID del usuario que acabamos de insertar
WITH usuario_insertado AS (
  SELECT id FROM usuarios WHERE clerk_user_id = 'user_31YQQ91CNo83prvw2lF3jBCv8Km'
)
-- Vincular el usuario con el socio existente (asumiendo que ya existe un socio)
UPDATE socios 
SET fk_id_usuario = (SELECT id FROM usuario_insertado)
WHERE razon_social = 'Socio-2'  -- Cambia esto por el nombre del socio que quieres vincular
AND fk_id_usuario IS NULL;  -- Solo actualizar si no está ya vinculado

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script en Supabase
-- 2. Reemplaza 'user_xxxxxxxxx' y 'user_yyyyyyyyy' con los IDs reales de Clerk
-- 3. Para obtener el ID de Clerk, abre la consola del navegador y ejecuta:
--    console.log('Clerk User ID:', await window.Clerk.user?.id)
-- =====================================================

