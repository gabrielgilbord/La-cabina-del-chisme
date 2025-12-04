-- Solución SIMPLE para corregir la recursión infinita en RLS
-- Ejecuta este script en el SQL Editor de Supabase

-- ============================================
-- PASO 1: Eliminar TODAS las políticas existentes
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

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
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PASO 3: Recrear políticas de PROFILES (sin recursión)
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los usuarios autenticados pueden ver perfiles (para evitar recursión)
-- Los admins se verifican en las políticas de chismes usando la función
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

-- Los admins pueden ver todos los chismes (usando función para evitar recursión)
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
-- Verificación: Ver los chismes aprobados
-- ============================================

SELECT 
  id, 
  titulo, 
  aprobado, 
  created_at,
  CASE 
    WHEN aprobado = TRUE THEN '✅ Aprobado' 
    ELSE '❌ Pendiente' 
  END as estado
FROM chismes
ORDER BY created_at DESC
LIMIT 10;

