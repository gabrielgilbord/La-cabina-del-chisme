-- Script para verificar y corregir el estado de admin de un usuario
-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario que quieres hacer admin

-- Ver el estado actual del usuario
SELECT 
  id,
  username,
  email,
  is_admin,
  created_at
FROM profiles
WHERE email = 'tu-email@ejemplo.com';

-- Hacer admin a un usuario (reemplaza el email)
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  username,
  email,
  is_admin,
  created_at
FROM profiles
WHERE email = 'tu-email@ejemplo.com';

-- Ver todos los admins
SELECT 
  id,
  username,
  email,
  is_admin
FROM profiles
WHERE is_admin = TRUE;

