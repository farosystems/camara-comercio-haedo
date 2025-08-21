-- =====================================================
-- SCRIPT SQL PARA SUPABASE - SISTEMA DE GESTIÓN
-- Agrupaciones Mar & Sierras
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA 1: MÓDULOS (MODULOS)
-- =====================================================
CREATE TABLE modulos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    icono VARCHAR(100),
    ruta VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 2: USUARIOS (USUARIOS) - Vinculada con Clerk
-- =====================================================
CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    password_hash VARCHAR(255),
    rol VARCHAR(20) NOT NULL DEFAULT 'socio' CHECK (rol IN ('admin', 'supervisor', 'socio')),
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prueba_gratis BOOLEAN DEFAULT true,
    clerk_user_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Bloqueado')),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 3: PERMISOS USUARIOS (PERMISOS_USUARIOS)
-- =====================================================
CREATE TABLE permisos_usuarios (
    id BIGSERIAL PRIMARY KEY,
    fk_id_usuario BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fk_id_modulo BIGINT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    puede_ver BOOLEAN DEFAULT false,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fk_id_usuario, fk_id_modulo)
);

-- =====================================================
-- TABLA 4: SOCIOS (SOCIOS)
-- =====================================================
CREATE TABLE socios (
    id BIGSERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    cuit VARCHAR(15) UNIQUE NOT NULL,
    tipo_sociedad VARCHAR(50) NOT NULL CHECK (tipo_sociedad IN ('S.R.L.', 'S.A.', 'Monotributista', 'Autónomo', 'Otro')),
    fecha_constitucion DATE,
    registro_mercantil VARCHAR(100),
    direccion_fiscal VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    web VARCHAR(255),
    condicion_fiscal VARCHAR(50) NOT NULL CHECK (condicion_fiscal IN ('Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final')),
    datos_bancarios TEXT,
    criterio_facturacion VARCHAR(50) NOT NULL CHECK (criterio_facturacion IN ('Anticipado', 'Por entrega', '30 días', '60 días', 'Contado')),
    representante_legal VARCHAR(100) NOT NULL,
    dni_representante VARCHAR(15) NOT NULL,
    cargo_representante VARCHAR(100) NOT NULL,
    actividad_economica VARCHAR(255),
    logo_path VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
    fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 5: CARGOS (CARGOS)
-- =====================================================
CREATE TABLE cargos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Fijo', 'Variable')),
    monto DECIMAL(10,2),
    descripcion TEXT NOT NULL,
    frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('Mensual', 'Trimestral', 'Semestral', 'Anual')),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 6: MOVIMIENTOS_SOCIOS (MOVIMIENTOS_SOCIOS)
-- =====================================================
CREATE TABLE movimientos_socios (
    id BIGSERIAL PRIMARY KEY,
    fk_id_socio BIGINT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Cargo', 'Pago')),
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    comprobante VARCHAR(50) NOT NULL,
    saldo DECIMAL(10,2) NOT NULL CHECK (saldo >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagado', 'Vencido', 'Anulado')),
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro')),
    referencia VARCHAR(100),
    fecha_vencimiento DATE,
    fk_id_cargo BIGINT REFERENCES cargos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 7: PROVEEDORES (PROVEEDORES)
-- =====================================================
CREATE TABLE proveedores (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    cuit VARCHAR(15) UNIQUE NOT NULL,
    direccion VARCHAR(255),
    metodos_pago JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 8: LISTAS_PRECIOS (LISTAS_PRECIOS)
-- =====================================================
CREATE TABLE listas_precios (
    id BIGSERIAL PRIMARY KEY,
    fk_id_proveedor BIGINT NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    fecha_carga DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (status IN ('Activa', 'Inactiva', 'Vencida')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 9: PRODUCTOS (PRODUCTOS)
-- =====================================================
CREATE TABLE productos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fk_id_lista_precio BIGINT REFERENCES listas_precios(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 10: ITEMS_LISTA_PRECIOS (ITEMS_LISTA_PRECIOS)
-- =====================================================
CREATE TABLE items_lista_precios (
    id BIGSERIAL PRIMARY KEY,
    fk_id_lista_precio BIGINT NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
    fk_id_producto BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    descuento DECIMAL(5,2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fk_id_lista_precio, fk_id_producto)
);

-- =====================================================
-- TABLA 11: CONDICIONES_COMPRA (CONDICIONES_COMPRA)
-- =====================================================
CREATE TABLE condiciones_compra (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Cuenta Corriente', 'Efectivo', 'Cheques', 'Transferencia')),
    descripcion TEXT NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
    recargo DECIMAL(5,2) DEFAULT 0 CHECK (recargo >= 0 AND recargo <= 100),
    dias_pago INTEGER NOT NULL DEFAULT 0 CHECK (dias_pago >= 0),
    fk_id_proveedor BIGINT REFERENCES proveedores(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 12: PEDIDOS (PEDIDOS)
-- =====================================================
CREATE TABLE pedidos (
    id VARCHAR(20) PRIMARY KEY,
    fk_id_socio BIGINT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fk_id_proveedor BIGINT NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Procesado', 'Entregado', 'Cancelado')),
    metodo_pago VARCHAR(100) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 13: ITEMS_PEDIDO (ITEMS_PEDIDO)
-- =====================================================
CREATE TABLE items_pedido (
    id BIGSERIAL PRIMARY KEY,
    fk_id_pedido VARCHAR(20) NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    fk_id_producto BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
    descuento DECIMAL(5,2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =====================================================
-- TABLA 14: CONFIGURACION_SISTEMA (CONFIGURACION_SISTEMA)
-- =====================================================
CREATE TABLE configuracion_sistema (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'String' CHECK (tipo IN ('String', 'Number', 'Boolean', 'JSON')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 15: FACTURAS (FACTURAS)
-- =====================================================
CREATE TABLE facturas (
    id VARCHAR(20) PRIMARY KEY,
    fk_id_socio BIGINT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    total DECIMAL(10,2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagada', 'Vencida', 'Anulada')),
    concepto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA 16: PAGOS (PAGOS)
-- =====================================================
CREATE TABLE pagos (
    id VARCHAR(20) PRIMARY KEY,
    fk_id_socio BIGINT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    metodo VARCHAR(20) NOT NULL CHECK (metodo IN ('Efectivo', 'Transferencia', 'Cheque', 'Tarjeta')),
    fk_id_factura VARCHAR(20) REFERENCES facturas(id) ON DELETE SET NULL,
    referencia VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para MÓDULOS
CREATE INDEX idx_modulos_nombre ON modulos(nombre);
CREATE INDEX idx_modulos_activo ON modulos(activo);
CREATE INDEX idx_modulos_orden ON modulos(orden);

-- Índices para USUARIOS
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_usuarios_clerk_user_id ON usuarios(clerk_user_id);

-- Índices para PERMISOS_USUARIOS
CREATE INDEX idx_permisos_usuarios_usuario ON permisos_usuarios(fk_id_usuario);
CREATE INDEX idx_permisos_usuarios_modulo ON permisos_usuarios(fk_id_modulo);
CREATE INDEX idx_permisos_usuarios_puede_ver ON permisos_usuarios(puede_ver);

-- Índices para SOCIOS
CREATE INDEX idx_socios_cuit ON socios(cuit);
CREATE INDEX idx_socios_status ON socios(status);
CREATE INDEX idx_socios_fecha_alta ON socios(fecha_alta);
CREATE INDEX idx_socios_email ON socios(email);

-- Índices para MOVIMIENTOS_SOCIOS
CREATE INDEX idx_movimientos_socios_socio_id ON movimientos_socios(fk_id_socio);
CREATE INDEX idx_movimientos_socios_fecha ON movimientos_socios(fecha);
CREATE INDEX idx_movimientos_socios_tipo ON movimientos_socios(tipo);
CREATE INDEX idx_movimientos_socios_estado ON movimientos_socios(estado);
CREATE INDEX idx_movimientos_socios_cargo_id ON movimientos_socios(fk_id_cargo);

-- Índices para PROVEEDORES
CREATE INDEX idx_proveedores_cuit ON proveedores(cuit);
CREATE INDEX idx_proveedores_status ON proveedores(status);
CREATE INDEX idx_proveedores_email ON proveedores(email);

-- Índices para PRODUCTOS
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_lista_precio_id ON productos(fk_id_lista_precio);

-- Índices para LISTAS_PRECIOS
CREATE INDEX idx_listas_precios_proveedor_id ON listas_precios(fk_id_proveedor);
CREATE INDEX idx_listas_precios_status ON listas_precios(status);
CREATE INDEX idx_listas_precios_fecha_carga ON listas_precios(fecha_carga);

-- Índices para ITEMS_LISTA_PRECIOS
CREATE INDEX idx_items_lista_precios_lista_precio_id ON items_lista_precios(fk_id_lista_precio);
CREATE INDEX idx_items_lista_precios_producto_id ON items_lista_precios(fk_id_producto);

-- Índices para CONDICIONES_COMPRA
CREATE INDEX idx_condiciones_compra_proveedor_id ON condiciones_compra(fk_id_proveedor);
CREATE INDEX idx_condiciones_compra_activo ON condiciones_compra(activo);

-- Índices para PEDIDOS
CREATE INDEX idx_pedidos_socio_id ON pedidos(fk_id_socio);
CREATE INDEX idx_pedidos_proveedor_id ON pedidos(fk_id_proveedor);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- Índices para ITEMS_PEDIDO
CREATE INDEX idx_items_pedido_pedido_id ON items_pedido(fk_id_pedido);
CREATE INDEX idx_items_pedido_producto_id ON items_pedido(fk_id_producto);

-- Índices para CONFIGURACION_SISTEMA
CREATE INDEX idx_configuracion_sistema_clave ON configuracion_sistema(clave);

-- Índices para FACTURAS
CREATE INDEX idx_facturas_socio_id ON facturas(fk_id_socio);
CREATE INDEX idx_facturas_fecha ON facturas(fecha);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);

-- Índices para PAGOS
CREATE INDEX idx_pagos_socio_id ON pagos(fk_id_socio);
CREATE INDEX idx_pagos_fecha ON pagos(fecha);
CREATE INDEX idx_pagos_factura_id ON pagos(fk_id_factura);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para actualizar actualizado_el en permisos
CREATE OR REPLACE FUNCTION update_permisos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_el = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_socios_updated_at BEFORE UPDATE ON socios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON cargos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimientos_socios_updated_at BEFORE UPDATE ON movimientos_socios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listas_precios_updated_at BEFORE UPDATE ON listas_precios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_condiciones_compra_updated_at BEFORE UPDATE ON condiciones_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_sistema_updated_at BEFORE UPDATE ON configuracion_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para permisos
CREATE TRIGGER update_permisos_usuarios_updated_at BEFORE UPDATE ON permisos_usuarios FOR EACH ROW EXECUTE FUNCTION update_permisos_updated_at();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar módulos del sistema
INSERT INTO modulos (nombre, descripcion, icono, ruta, orden, activo) VALUES
('DASHBOARD', 'Panel principal del sistema', 'Home', '/', 1, true),
('SOCIOS', 'Gestión de socios de la agrupación', 'Users', '/members', 2, true),
('FACTURACION', 'Facturación y cobranzas a socios', 'Receipt', '/billing', 3, true),
('PROVEEDORES', 'Gestión de proveedores y productos', 'Truck', '/providers', 4, true),
('PEDIDOS', 'Gestión de pedidos a proveedores', 'ShoppingCart', '/orders', 5, true),
('CONTABILIDAD', 'Cuentas corrientes y pagos', 'Calculator', '/accounting', 6, true),
('ADMINISTRACION', 'Configuración del sistema', 'Settings', '/admin', 7, true),
('SEGURIDAD', 'Gestión de permisos y usuarios', 'Shield', '/security', 8, true);

-- Insertar configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
('organization_name', 'Agrupación Mar & Sierras', 'Nombre de la agrupación', 'String'),
('organization_cuit', '20-12345678-9', 'CUIT de la agrupación', 'String'),
('organization_address', 'Av. San Martín 1234, CABA', 'Dirección de la agrupación', 'String'),
('organization_phone', '+54 11 4567-8901', 'Teléfono de la agrupación', 'String'),
('organization_email', 'info@agrupacion.com', 'Email de la agrupación', 'String'),
('currency', 'ARS', 'Moneda del sistema', 'String'),
('timezone', 'America/Argentina/Buenos_Aires', 'Zona horaria', 'String'),
('invoice_prefix', 'FAC-', 'Prefijo de facturas', 'String'),
('next_invoice_number', '1', 'Próximo número de factura', 'Number'),
('payment_terms_days', '30', 'Plazo de pago en días', 'Number'),
('tax_rate', '21', 'Tasa de IVA', 'Number'),
('clerk_publishable_key', '', 'Clave pública de Clerk', 'String'),
('clerk_secret_key', '', 'Clave secreta de Clerk', 'String');

-- Insertar cargos por defecto
INSERT INTO cargos (nombre, tipo, monto, descripcion, frecuencia, activo) VALUES
('Cuota Social Mensual', 'Fijo', 5000.00, 'Cuota mensual obligatoria para todos los socios', 'Mensual', true),
('Servicios de Agua', 'Variable', NULL, 'Consumo de agua según medidor', 'Mensual', true),
('Servicios de Electricidad', 'Variable', NULL, 'Consumo de electricidad según medidor', 'Mensual', true),
('Mantenimiento de Instalaciones', 'Fijo', 2500.00, 'Cargo por mantenimiento de instalaciones comunes', 'Mensual', true);

-- Insertar condiciones de compra por defecto
INSERT INTO condiciones_compra (nombre, tipo, descripcion, descuento, recargo, dias_pago, activo) VALUES
('Cuenta Corriente Estándar', 'Cuenta Corriente', 'Pago a 30 días sin descuentos ni recargos', 0, 0, 30, true),
('Efectivo 10%', 'Efectivo', 'Descuento por pago inmediato en efectivo', 10, 0, 0, true),
('Cheques 30/60/90', 'Cheques', 'Pago diferido con cheques a 30, 60 y 90 días', 0, 5, 90, true);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, rol, clerk_user_id, status) VALUES
('Administrador', 'admin@agrupacion.com', 'admin', NULL, 'Activo');

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE listas_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_lista_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE condiciones_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para MÓDULOS (todos pueden ver módulos activos)
CREATE POLICY "Todos pueden ver módulos activos" ON modulos FOR SELECT USING (activo = true);

-- Políticas para USUARIOS (solo admins pueden gestionar)
CREATE POLICY "Admins pueden gestionar usuarios" ON usuarios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.clerk_user_id = auth.uid() 
        AND u.rol = 'admin'
    )
);

-- Políticas para PERMISOS_USUARIOS (solo admins)
CREATE POLICY "Admins pueden gestionar permisos" ON permisos_usuarios FOR ALL USING (
    EXISTS (
        SELECT 1 FROM usuarios u 
        WHERE u.clerk_user_id = auth.uid() 
        AND u.rol = 'admin'
    )
);

-- Políticas básicas para el resto de tablas (ajustar según necesidades)
CREATE POLICY "Administradores pueden ver todo" ON socios FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON cargos FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON movimientos_socios FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON proveedores FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON listas_precios FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON productos FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON items_lista_precios FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON condiciones_compra FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON pedidos FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON items_pedido FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON configuracion_sistema FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON facturas FOR ALL USING (true);
CREATE POLICY "Administradores pueden ver todo" ON pagos FOR ALL USING (true);

-- =====================================================
-- FUNCIONES DE AUTENTICACIÓN Y PERMISOS
-- =====================================================

-- Función para obtener el usuario actual
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS usuarios AS $$
DECLARE
    current_user usuarios;
BEGIN
    SELECT * INTO current_user 
    FROM usuarios 
    WHERE clerk_user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;
    
    RETURN current_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar permisos de módulo
CREATE OR REPLACE FUNCTION check_module_permission(module_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user usuarios;
    has_permission BOOLEAN;
BEGIN
    -- Obtener usuario actual
    SELECT * INTO current_user FROM get_current_user();
    
    -- Los administradores tienen acceso completo
    IF current_user.rol = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permisos específicos del módulo
    SELECT pu.puede_ver INTO has_permission
    FROM permisos_usuarios pu
    JOIN modulos m ON pu.fk_id_modulo = m.id
    WHERE pu.fk_id_usuario = current_user.id
    AND m.nombre = module_name;
    
    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener módulos del usuario
CREATE OR REPLACE FUNCTION get_user_modules()
RETURNS TABLE (
    id BIGINT,
    nombre TEXT,
    descripcion TEXT,
    icono TEXT,
    ruta TEXT,
    orden INTEGER
) AS $$
DECLARE
    current_user usuarios;
BEGIN
    -- Obtener usuario actual
    SELECT * INTO current_user FROM get_current_user();
    
    -- Los administradores ven todos los módulos activos
    IF current_user.rol = 'admin' THEN
        RETURN QUERY
        SELECT m.id, m.nombre, m.descripcion, m.icono, m.ruta, m.orden
        FROM modulos m
        WHERE m.activo = true
        ORDER BY m.orden;
    ELSE
        -- Otros usuarios ven solo módulos con permisos
        RETURN QUERY
        SELECT m.id, m.nombre, m.descripcion, m.icono, m.ruta, m.orden
        FROM modulos m
        JOIN permisos_usuarios pu ON m.id = pu.fk_id_modulo
        WHERE pu.fk_id_usuario = current_user.id
        AND pu.puede_ver = true
        AND m.activo = true
        ORDER BY m.orden;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE modulos IS 'Módulos del sistema con permisos';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema vinculados con Clerk';
COMMENT ON TABLE permisos_usuarios IS 'Permisos de usuarios por módulo';
COMMENT ON TABLE socios IS 'Tabla maestra de socios de la agrupación';
COMMENT ON TABLE cargos IS 'Tipos de cargos aplicables a los socios';
COMMENT ON TABLE movimientos_socios IS 'Movimientos financieros de los socios';
COMMENT ON TABLE proveedores IS 'Catálogo de proveedores';
COMMENT ON TABLE listas_precios IS 'Listas de precios por proveedor';
COMMENT ON TABLE productos IS 'Catálogo de productos';
COMMENT ON TABLE items_lista_precios IS 'Items de precios en las listas';
COMMENT ON TABLE condiciones_compra IS 'Condiciones comerciales de compra';
COMMENT ON TABLE pedidos IS 'Pedidos de socios a proveedores';
COMMENT ON TABLE items_pedido IS 'Items de los pedidos';
COMMENT ON TABLE configuracion_sistema IS 'Configuración general del sistema';
COMMENT ON TABLE facturas IS 'Facturas emitidas a socios';
COMMENT ON TABLE pagos IS 'Pagos registrados por socios';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
