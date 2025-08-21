-- =====================================================
-- FIX PERMISOS PARA CONDICIONES DE COMPRA
-- Dar acceso de lectura a la tabla condiciones_compra para usuarios socio
-- =====================================================

-- 1. Crear una política RLS para permitir lectura de condiciones_compra a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de condiciones_compra a usuarios autenticados" ON condiciones_compra
FOR SELECT
TO authenticated
USING (true);

-- 2. Alternativamente, si quieres ser más específico y solo dar acceso a socios:
-- CREATE POLICY "Permitir lectura de condiciones_compra a socios" ON condiciones_compra
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM usuarios 
--     WHERE usuarios.clerk_user_id = auth.uid() 
--     AND usuarios.rol = 'socio'
--   )
-- );

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================


