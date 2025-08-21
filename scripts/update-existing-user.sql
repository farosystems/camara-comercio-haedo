-- Actualizar el usuario existente (ID 3) con el clerk_user_id
UPDATE usuarios 
SET clerk_user_id = 'user_31YQQ91CNo83prvw2lF3jBCv8Km',
    updated_at = NOW()
WHERE id = 3;

-- Verificar que se actualizó correctamente
SELECT id, email, rol, clerk_user_id, status 
FROM usuarios 
WHERE id = 3;

