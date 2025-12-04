-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de chismes
CREATE TABLE IF NOT EXISTS chismes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  aprobado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para crear perfil automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'usuario_' || substr(NEW.id::text, 1, 8)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_chismes_updated_at
  BEFORE UPDATE ON chismes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chismes ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Políticas para chismes
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

-- Los admins pueden ver todos los chismes
CREATE POLICY "Admins can view all chismes"
  ON chismes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Los admins pueden actualizar chismes (aprobarlos)
CREATE POLICY "Admins can update chismes"
  ON chismes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Los admins pueden eliminar chismes
CREATE POLICY "Admins can delete chismes"
  ON chismes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chismes_aprobado ON chismes(aprobado);
CREATE INDEX IF NOT EXISTS idx_chismes_created_at ON chismes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chismes_user_id ON chismes(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

