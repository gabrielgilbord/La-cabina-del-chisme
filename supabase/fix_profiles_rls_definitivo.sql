-- Script DEFINITIVO para corregir la recursión en profiles
-- Ejecuta este script en Supabase SQL Editor

-- ============================================
-- PASO 1: Eliminar TODAS las políticas de profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON profiles;

-- ============================================
-- PASO 2: Recrear políticas SIN recursión
-- ============================================

-- Los usuarios pueden ver su propio perfil (sin consultar profiles)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- IMPORTANTE: Permitir que usuarios autenticados vean perfiles
-- Esto evita la recursión porque no consulta profiles dentro de la política
CREATE POLICY "Authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Verificación
-- ============================================

-- Esto debería funcionar sin recursión
SELECT id, email, is_admin 
FROM profiles 
WHERE id = auth.uid();

