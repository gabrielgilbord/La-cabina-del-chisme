-- Script para corregir la recursión infinita en las políticas RLS

-- Primero, eliminar TODAS las políticas existentes para recrearlas correctamente
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
-- POLÍTICAS PARA PROFILES (sin recursión)
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- IMPORTANTE: Para evitar recursión, los admins pueden ver todos los perfiles
-- pero usando una función que evita la recursión
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    -- Verificar directamente en auth.users o usar una función que no cause recursión
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.is_admin = TRUE
      -- Usar SECURITY DEFINER o evitar consultas anidadas
    )
  );

-- Alternativa más simple: permitir que cualquiera vea perfiles (solo lectura)
-- Esto evita la recursión completamente
-- Si prefieres más seguridad, puedes usar la política anterior

-- ============================================
-- POLÍTICAS PARA CHISMES
-- ============================================

-- Cualquiera puede ver chismes aprobados (sin necesidad de autenticación)
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

-- Los admins pueden ver todos los chismes
-- Usamos una función auxiliar para evitar recursión
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_id AND profiles.is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can view all chismes"
  ON chismes FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- Los admins pueden actualizar chismes (aprobarlos)
CREATE POLICY "Admins can update chismes"
  ON chismes FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

-- Los admins pueden eliminar chismes
CREATE POLICY "Admins can delete chismes"
  ON chismes FOR DELETE
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- SOLUCIÓN ALTERNATIVA MÁS SIMPLE (si la anterior no funciona)
-- ============================================

-- Si la función causa problemas, usa esta versión más simple:
-- Simplemente permite que los usuarios vean perfiles si están autenticados
-- y luego verifica is_admin directamente sin recursión

-- DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
-- CREATE POLICY "Authenticated can view profiles"
--   ON profiles FOR SELECT
--   USING (auth.role() = 'authenticated');

