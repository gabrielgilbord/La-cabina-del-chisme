# 🎙️ La Cabina del Chisme

Una red social moderna donde puedes compartir chismes de forma anónima. Los administradores moderan el contenido antes de que sea publicado.

## 🚀 Características

- ✅ Publicación de chismes de forma anónima (pero guardando quién lo publicó en la base de datos)
- ✅ Sistema de autenticación con Supabase
- ✅ Panel de administración para moderar chismes
- ✅ Los admins pueden ver quién publicó cada chisme
- ✅ Diseño responsive y moderno
- ✅ Interfaz atractiva con gradientes y animaciones

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase con proyecto creado
- Las credenciales de Supabase ya están configuradas en `.env.local`

## 🛠️ Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Configura la base de datos en Supabase:
   - Ve a tu proyecto de Supabase
   - Abre el SQL Editor
   - Ejecuta el contenido del archivo `supabase/schema.sql`

3. Crea un usuario administrador:
   - Después de crear tu cuenta, ejecuta este SQL en Supabase para convertirte en admin:
   ```sql
   UPDATE profiles 
   SET is_admin = TRUE 
   WHERE email = 'tu-email@ejemplo.com';
   ```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
├── app/
│   ├── admin/          # Panel de administración
│   ├── login/          # Página de inicio de sesión
│   ├── signup/         # Página de registro
│   ├── publicar/       # Página para publicar chismes
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página principal (feed de chismes)
├── components/
│   ├── Navbar.tsx      # Barra de navegación
│   └── ChismesFeed.tsx # Componente del feed de chismes
├── lib/
│   └── supabase/       # Configuración de Supabase
└── supabase/
    └── schema.sql      # Esquema de la base de datos
```

## 🎨 Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Supabase** - Backend (autenticación y base de datos)
- **date-fns** - Formateo de fechas

## 🔐 Funcionalidades de Seguridad

- Row Level Security (RLS) habilitado en Supabase
- Solo los admins pueden ver información de los usuarios
- Los chismes solo se muestran públicamente si están aprobados
- Los usuarios solo pueden ver sus propios chismes no aprobados

## 📝 Notas

- Los chismes se publican de forma anónima para los usuarios normales
- Los administradores pueden ver quién publicó cada chisme
- Todos los chismes deben ser aprobados por un admin antes de aparecer en el feed público
- El diseño es completamente responsive y funciona en móviles, tablets y desktop

## 🎯 Próximas Mejoras (Opcional)

- Sistema de likes/reacciones
- Comentarios en los chismes
- Categorías o tags
- Búsqueda de chismes
- Notificaciones cuando un chisme es aprobado

