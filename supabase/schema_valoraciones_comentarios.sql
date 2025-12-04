-- Schema para valoraciones y comentarios

-- ============================================
-- PASO 1: Crear función auxiliar para verificar admin (si no existe)
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
-- PASO 2: Crear tablas
-- ============================================

-- Tabla de valoraciones (me gusta/dislike)
CREATE TABLE IF NOT EXISTS valoraciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chisme_id UUID REFERENCES chismes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('me_gusta', 'mierdachisme')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chisme_id, user_id) -- Un usuario solo puede valorar una vez por chisme
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chisme_id UUID REFERENCES chismes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contenido TEXT NOT NULL,
  aprobado BOOLEAN DEFAULT TRUE, -- Los comentarios se publican directamente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar updated_at en comentarios
DROP TRIGGER IF EXISTS update_comentarios_updated_at ON comentarios;
CREATE TRIGGER update_comentarios_updated_at
  BEFORE UPDATE ON comentarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS
ALTER TABLE valoraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar errores)
DROP POLICY IF EXISTS "Anyone can view valoraciones" ON valoraciones;
DROP POLICY IF EXISTS "Authenticated users can create valoraciones" ON valoraciones;
DROP POLICY IF EXISTS "Users can update own valoraciones" ON valoraciones;
DROP POLICY IF EXISTS "Users can delete own valoraciones" ON valoraciones;

DROP POLICY IF EXISTS "Anyone can view comentarios" ON comentarios;
DROP POLICY IF EXISTS "Anyone can view approved comentarios" ON comentarios;
DROP POLICY IF EXISTS "Users can view own comentarios" ON comentarios;
DROP POLICY IF EXISTS "Authenticated users can create comentarios" ON comentarios;
DROP POLICY IF EXISTS "Users can update own comentarios" ON comentarios;
DROP POLICY IF EXISTS "Users can delete own comentarios" ON comentarios;
DROP POLICY IF EXISTS "Admins can view all comentarios" ON comentarios;
DROP POLICY IF EXISTS "Admins can update comentarios" ON comentarios;
DROP POLICY IF EXISTS "Admins can delete comentarios" ON comentarios;

-- Políticas para valoraciones
-- Cualquiera puede ver valoraciones de chismes aprobados
CREATE POLICY "Anyone can view valoraciones"
  ON valoraciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chismes
      WHERE chismes.id = valoraciones.chisme_id AND chismes.aprobado = TRUE
    )
  );

-- Los usuarios autenticados pueden crear valoraciones
CREATE POLICY "Authenticated users can create valoraciones"
  ON valoraciones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar sus propias valoraciones
CREATE POLICY "Users can update own valoraciones"
  ON valoraciones FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias valoraciones
CREATE POLICY "Users can delete own valoraciones"
  ON valoraciones FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para comentarios
-- Cualquiera puede ver comentarios de chismes aprobados (todos están aprobados por defecto)
CREATE POLICY "Anyone can view comentarios"
  ON comentarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chismes
      WHERE chismes.id = comentarios.chisme_id AND chismes.aprobado = TRUE
    )
  );

-- Los usuarios pueden ver sus propios comentarios (aprobados o no)
CREATE POLICY "Users can view own comentarios"
  ON comentarios FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comentarios"
  ON comentarios FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update own comentarios"
  ON comentarios FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comentarios"
  ON comentarios FOR DELETE
  USING (auth.uid() = user_id);

-- Los admins pueden ver todos los comentarios
CREATE POLICY "Admins can view all comentarios"
  ON comentarios FOR SELECT
  USING (public.is_admin());

-- Los admins pueden aprobar comentarios
CREATE POLICY "Admins can update comentarios"
  ON comentarios FOR UPDATE
  USING (public.is_admin());

-- Los admins pueden eliminar comentarios
CREATE POLICY "Admins can delete comentarios"
  ON comentarios FOR DELETE
  USING (public.is_admin());

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_valoraciones_chisme_id ON valoraciones(chisme_id);
CREATE INDEX IF NOT EXISTS idx_valoraciones_user_id ON valoraciones(user_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_chisme_id ON comentarios(chisme_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_user_id ON comentarios(user_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_aprobado ON comentarios(aprobado);
CREATE INDEX IF NOT EXISTS idx_comentarios_created_at ON comentarios(created_at DESC);

