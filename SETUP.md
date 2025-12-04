# 🚀 Guía de Configuración - La Cabina del Chisme

## Paso 1: Instalar Dependencias

```bash
npm install
```

## Paso 2: Configurar Supabase

### 2.1 Crear las Tablas

1. Ve a tu proyecto de Supabase: https://kxvyyothqgeemxmgpwvz.supabase.co
2. Abre el **SQL Editor** en el panel izquierdo
3. Copia y pega todo el contenido del archivo `supabase/schema.sql`
4. Ejecuta el script haciendo clic en "Run" o presionando `Ctrl+Enter`

### 2.2 Configurar URLs de Redirección

1. Ve a **Authentication** > **URL Configuration** en el panel de Supabase
2. Agrega estas URLs a "Redirect URLs":
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (para producción, agrega tu dominio)

### 2.3 Crear tu Primer Usuario Admin

1. Ejecuta la aplicación: `npm run dev`
2. Ve a `http://localhost:3000/signup`
3. Crea una cuenta con tu email
4. Ve al SQL Editor de Supabase y ejecuta:

```sql
UPDATE profiles 
SET is_admin = TRUE 
WHERE email = 'tu-email@ejemplo.com';
```

Reemplaza `'tu-email@ejemplo.com'` con el email que usaste para registrarte.

## Paso 3: Ejecutar la Aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ✅ Verificación

1. **Página Principal**: Deberías ver el feed de chismes (vacío al inicio)
2. **Registro**: Crea una cuenta en `/signup`
3. **Publicar**: Ve a `/publicar` y crea un chisme
4. **Admin**: Si eres admin, ve a `/admin` para moderar chismes

## 🔧 Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script SQL completo en Supabase

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén correctamente configuradas
- Asegúrate de que el trigger `on_auth_user_created` esté funcionando

### No puedo ver el panel de admin
- Verifica que tu usuario tenga `is_admin = TRUE` en la tabla `profiles`
- Ejecuta: `SELECT * FROM profiles WHERE email = 'tu-email@ejemplo.com';`

### Los chismes no aparecen
- Verifica que los chismes tengan `aprobado = TRUE`
- Solo los admins pueden aprobar chismes desde `/admin`

## 📝 Notas Importantes

- Los chismes se publican de forma **anónima** para los usuarios normales
- Los **administradores** pueden ver quién publicó cada chisme
- Todos los chismes deben ser **aprobados** antes de aparecer en el feed público
- El diseño es **completamente responsive**

