-- =====================================================
-- SOLUCIÓN SIMPLE PARA PERMISOS DE CONDICIONES DE COMPRA
-- =====================================================

-- Habilitar RLS en la tabla si no está habilitado
ALTER TABLE condiciones_compra ENABLE ROW LEVEL SECURITY;

-- Crear política simple para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura de condiciones activas" ON condiciones_compra
FOR SELECT
TO authenticated
USING (activo = true);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================


