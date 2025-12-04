-- Script para corregir las políticas de profiles si hay problemas

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON profiles;

-- Recrear políticas (versión simple que debería funcionar)
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los usuarios autenticados pueden ver perfiles (para evitar problemas)
CREATE POLICY "Authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verificar que funciona
-- Esto debería mostrar tu perfil si estás autenticado
SELECT id, email, is_admin 
FROM profiles 
WHERE id = auth.uid();

