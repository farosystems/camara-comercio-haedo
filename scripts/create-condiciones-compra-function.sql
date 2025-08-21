-- =====================================================
-- FUNCIÓN RPC PARA CONDICIONES DE COMPRA ACTIVAS
-- Crear función que no requiera permisos especiales
-- =====================================================

-- Crear función RPC para obtener condiciones de compra activas
CREATE OR REPLACE FUNCTION get_condiciones_compra_activas()
RETURNS TABLE (
  id BIGINT,
  nombre VARCHAR,
  tipo VARCHAR,
  descripcion TEXT,
  descuento NUMERIC,
  recargo NUMERIC,
  dias_pago INTEGER,
  fk_id_proveedor BIGINT,
  activo BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.nombre,
    cc.tipo,
    cc.descripcion,
    cc.descuento,
    cc.recargo,
    cc.dias_pago,
    cc.fk_id_proveedor,
    cc.activo,
    cc.created_at,
    cc.updated_at
  FROM condiciones_compra cc
  WHERE cc.activo = true
  ORDER BY cc.nombre;
END;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_condiciones_compra_activas() TO authenticated;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================


