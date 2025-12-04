-- Script COMPLETO para corregir TODAS las políticas RLS y eliminar recursión
-- Ejecuta este script COMPLETO en Supabase SQL Editor

-- ============================================
-- PASO 1: Eliminar TODAS las políticas existentes
-- ============================================

-- Eliminar políticas de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON profiles;

-- Eliminar políticas de chismes
DROP POLICY IF EXISTS "Anyone can view approved chismes" ON chismes;
DROP POLICY IF EXISTS "Authenticated users can create chismes" ON chismes;
DROP POLICY IF EXISTS "Users can view own chismes" ON chismes;
DROP POLICY IF EXISTS "Admins can view all chismes" ON chismes;
DROP POLICY IF EXISTS "Admins can update chismes" ON chismes;
DROP POLICY IF EXISTS "Admins can delete chismes" ON chismes;

-- ============================================
-- PASO 2: Crear función auxiliar para verificar admin (evita recursión)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Usar SECURITY DEFINER para evitar recursión en RLS
  -- Esta función se ejecuta con permisos de superusuario, evitando RLS
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PASO 3: Recrear políticas de PROFILES (SIN recursión)
-- ============================================

-- Los usuarios pueden ver su propio perfil (solo compara con auth.uid(), no consulta profiles)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- IMPORTANTE: Permitir que usuarios autenticados vean perfiles
-- Esto NO consulta profiles dentro de la política, solo verifica auth.role()
CREATE POLICY "Authenticated can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- PASO 4: Recrear políticas de CHISMES
-- ============================================

-- Cualquiera puede ver chismes aprobados
CREATE POLICY "Anyone can view approved chismes"
  ON chismes FOR SELECT
  USING (aprobado = TRUE);

-- Los usuarios autenticados pueden crear chismes
CREATE POLICY "Authenticated users can create chismes"
  ON chismes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden ver sus propios chismes (aprobados o no)
CREATE POLICY "Users can view own chismes"
  ON chismes FOR SELECT
  USING (auth.uid() = user_id);

-- Los admins pueden ver todos los chismes (usando función que evita recursión)
CREATE POLICY "Admins can view all chismes"
  ON chismes FOR SELECT
  USING (public.is_admin());

-- Los admins pueden actualizar chismes (aprobarlos)
CREATE POLICY "Admins can update chismes"
  ON chismes FOR UPDATE
  USING (public.is_admin());

-- Los admins pueden eliminar chismes
CREATE POLICY "Admins can delete chismes"
  ON chismes FOR DELETE
  USING (public.is_admin());

-- ============================================
-- Verificación
-- ============================================

-- Esto debería funcionar sin recursión
SELECT id, email, is_admin 
FROM profiles 
WHERE id = auth.uid();

