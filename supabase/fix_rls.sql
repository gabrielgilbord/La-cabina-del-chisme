-- Script para verificar y corregir las políticas RLS de chismes

-- Primero, eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Anyone can view approved chismes" ON chismes;
DROP POLICY IF EXISTS "Users can view own chismes" ON chismes;
DROP POLICY IF EXISTS "Admins can view all chismes" ON chismes;

-- Política para que CUALQUIERA (incluso usuarios anónimos) pueda ver chismes aprobados
CREATE POLICY "Anyone can view approved chismes"
  ON chismes FOR SELECT
  USING (aprobado = TRUE);

-- Los usuarios pueden ver sus propios chismes (aprobados o no)
CREATE POLICY "Users can view own chismes"
  ON chismes FOR SELECT
  USING (auth.uid() = user_id);

-- Los admins pueden ver todos los chismes
CREATE POLICY "Admins can view all chismes"
  ON chismes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Verificar que los chismes existen y están aprobados
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

