-- Script para agregar campo anónimo y sistema de notificaciones

-- ============================================
-- PASO 1: Agregar campo anónimo a chismes
-- ============================================

-- Agregar columna anonimo si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chismes' AND column_name = 'anonimo'
  ) THEN
    ALTER TABLE chismes ADD COLUMN anonimo BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================
-- PASO 2: Crear tabla de notificaciones
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('comentario', 'aprobado', 'rechazado')),
  chisme_id UUID REFERENCES chismes(id) ON DELETE CASCADE,
  comentario_id UUID REFERENCES comentarios(id) ON DELETE CASCADE,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_chisme_id ON notificaciones(chisme_id);

-- Habilitar RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar errores)
DROP POLICY IF EXISTS "Users can view own notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Users can update own notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Users can delete own notificaciones" ON notificaciones;

-- Políticas para notificaciones
-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update own notificaciones"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete own notificaciones"
  ON notificaciones FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PASO 3: Función para crear notificación cuando se comenta un chisme
-- ============================================

CREATE OR REPLACE FUNCTION public.notificar_comentario()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar al autor del chisme (si no es el mismo que comentó)
  INSERT INTO public.notificaciones (user_id, tipo, chisme_id, comentario_id)
  SELECT 
    c.user_id,
    'comentario',
    NEW.chisme_id,
    NEW.id
  FROM chismes c
  WHERE c.id = NEW.chisme_id
  AND c.user_id != NEW.user_id; -- No notificar al propio autor del comentario
  
  -- Notificar a todos los usuarios que han comentado en este chisme
  -- (excepto al autor del chisme, que ya fue notificado arriba, y al autor del comentario nuevo)
  INSERT INTO public.notificaciones (user_id, tipo, chisme_id, comentario_id)
  SELECT DISTINCT
    com.user_id,
    'comentario',
    NEW.chisme_id,
    NEW.id
  FROM comentarios com
  WHERE com.chisme_id = NEW.chisme_id
  AND com.user_id != NEW.user_id -- No notificar al autor del comentario nuevo
  AND com.user_id != (SELECT user_id FROM chismes WHERE id = NEW.chisme_id) -- No notificar al autor del chisme (ya fue notificado arriba)
  AND NOT EXISTS (
    -- Evitar duplicados: no crear notificación si ya existe una para este usuario y chisme reciente
    SELECT 1 FROM notificaciones n
    WHERE n.user_id = com.user_id
    AND n.chisme_id = NEW.chisme_id
    AND n.tipo = 'comentario'
    AND n.created_at > NOW() - INTERVAL '1 minute'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear notificación cuando se inserta un comentario
DROP TRIGGER IF EXISTS on_comentario_created ON comentarios;
CREATE TRIGGER on_comentario_created
  AFTER INSERT ON comentarios
  FOR EACH ROW
  WHEN (NEW.aprobado = TRUE) -- Solo notificar si el comentario está aprobado
  EXECUTE FUNCTION public.notificar_comentario();

-- ============================================
-- PASO 4: Función para crear notificación cuando se aprueba un chisme
-- ============================================

CREATE OR REPLACE FUNCTION public.notificar_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el chisme cambió de no aprobado a aprobado
  IF OLD.aprobado = FALSE AND NEW.aprobado = TRUE THEN
    INSERT INTO public.notificaciones (user_id, tipo, chisme_id)
    VALUES (NEW.user_id, 'aprobado', NEW.id);
  END IF;
  
  -- Si el chisme cambió de aprobado a no aprobado (rechazado)
  IF OLD.aprobado = TRUE AND NEW.aprobado = FALSE THEN
    INSERT INTO public.notificaciones (user_id, tipo, chisme_id)
    VALUES (NEW.user_id, 'rechazado', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear notificación cuando se aprueba/rechaza un chisme
DROP TRIGGER IF EXISTS on_chisme_aprobado ON chismes;
CREATE TRIGGER on_chisme_aprobado
  AFTER UPDATE OF aprobado ON chismes
  FOR EACH ROW
  WHEN (OLD.aprobado IS DISTINCT FROM NEW.aprobado)
  EXECUTE FUNCTION public.notificar_aprobacion();

