# TutorLink 🎓

Plataforma que conecta estudiantes universitarios con profesores en Bolivia.  
Los profesores cargan créditos, pagan Bs. 1 por cotización y 10% de comisión al cerrar un trato. Al aceptarse, se revelan los datos de contacto de ambas partes.

---

## 🚀 Deploy gratis en 15 minutos

### 1. Crea tu cuenta en GitHub (gratis)
1. Ve a [github.com](https://github.com) → Sign up
2. Crea un repositorio nuevo llamado `tutorlink`
3. Sube esta carpeta completa al repositorio

```bash
git init
git add .
git commit -m "TutorLink v1"
git remote add origin https://github.com/TU_USUARIO/tutorlink.git
git push -u origin main
```

---

### 2. Obtén tu API Key de Claude (gratis)
1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta → API Keys → Create Key
3. Guarda la clave: `sk-ant-...`

---

### 3. Crea tu base de datos en Supabase (gratis)
1. Ve a [supabase.com](https://supabase.com) → New project
2. Elige un nombre: `tutorlink`, región: South America
3. Ve a **SQL Editor** → pega el contenido de `supabase-schema.sql` → Run
4. Ve a **Settings → API** y copia:
   - `Project URL` → es tu `SUPABASE_URL`
   - `anon public` → es tu `SUPABASE_ANON_KEY`

---

### 4. Deploy en Vercel (gratis)
1. Ve a [vercel.com](https://vercel.com) → Log in with GitHub
2. Click **New Project** → importa tu repositorio `tutorlink`
3. En **Environment Variables** agrega:

| Variable | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |

4. Click **Deploy** — ¡listo en 2 minutos!

Tu URL será: `https://tutorlink.vercel.app` (o con tu dominio personalizado)

---

### 5. Dominio personalizado (opcional, ~$10/año)
- En Vercel → Settings → Domains → agrega `tutorlink.bo` o `tutorlink.com.bo`
- Compra el dominio en [nic.bo](https://nic.bo) o [namecheap.com](https://namecheap.com)

---

## 🛠 Desarrollo local

```bash
# 1. Instala dependencias
npm install

# 2. Crea el archivo de variables
cp .env.example .env.local
# Llena los valores en .env.local

# 3. Inicia el servidor
npm run dev

# Abre http://localhost:3000
```

---

## 👥 Cuentas demo (sin Supabase)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Estudiante | juan@alumno.com | 123456 |
| Profesor | carlos@tutor.com | 123456 |

> La app funciona completamente con localStorage sin necesidad de Supabase. Conéctalo cuando quieras persistencia real.

---

## 📱 Instalar como app en celular (PWA)

### Android (Chrome):
1. Abre la web en Chrome
2. Toca el ícono de menú (⋮) → "Agregar a pantalla de inicio"
3. ¡Listo! Aparece como app en tu celular

### iPhone (Safari):
1. Abre la web en Safari
2. Toca el botón compartir → "Agregar a pantalla de inicio"

---

## 💰 Modelo de negocio

| Evento | Cobro |
|--------|-------|
| Profesor envía cotización | –Bs. 1 del crédito |
| Trato aceptado | –10% del valor del trabajo |
| Estudiante usa la plataforma | Gratis |

**Ejemplo:** Tutoría de Bs. 75
- Estudiante paga: Bs. 75 al profesor directamente
- Profesor descuenta de créditos: Bs. 7.50 (10%)
- TutorLink gana: Bs. 1 (cotización) + Bs. 7.50 (comisión) = **Bs. 8.50**

---

## 🗺 Roadmap

- [ ] Supabase real-time chat
- [ ] Integración Tigo Money API
- [ ] Sistema de calificaciones
- [ ] App React Native (iOS + Android)
- [ ] Panel de administración
- [ ] Notificaciones push (Firebase)
- [ ] Videollamadas integradas (Daily.co)

---

## 📦 Stack tecnológico

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | Next.js 14 + Tailwind | Gratis |
| Deploy | Vercel | Gratis |
| Base de datos | Supabase (PostgreSQL) | Gratis |
| IA | Claude API (Anthropic) | Gratis inicial |
| Auth | Supabase Auth | Gratis |
| Dominio | .vercel.app | Gratis |

**Costo total para lanzar: $0** (solo el dominio ~$10/año si quieres uno personalizado)
