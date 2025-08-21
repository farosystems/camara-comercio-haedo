-- Crear la tabla pedidos_items
CREATE TABLE IF NOT EXISTS pedidos_items (
    id SERIAL PRIMARY KEY,
    fk_id_pedido INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    fk_id_producto INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_items_pedido ON pedidos_items(fk_id_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_producto ON pedidos_items(fk_id_producto);

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos_items' 
ORDER BY ordinal_position;

