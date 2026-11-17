-- =============================================
-- TutorLink — Schema SQL para Supabase
-- Pega esto en Supabase → SQL Editor → Run
-- =============================================

-- Perfiles de usuarios
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  last_name text,
  phone text,
  role text check (role in ('student','teacher')) not null,
  university text,
  materias text,
  rate numeric default 70,
  credits numeric default 0,
  quotes_used int default 0,
  rating numeric default 0,
  total_reviews int default 0,
  bio text,
  created_at timestamptz default now()
);

-- Solicitudes de estudiantes
create table solicitudes (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade,
  student_name text,
  student_phone text,
  tipo text,
  materia text,
  descripcion text,
  presupuesto numeric,
  modalidad text,
  status text check (status in ('open','negotiating','accepted','completed','cancelled')) default 'open',
  created_at timestamptz default now()
);

-- Cotizaciones de profesores
create table cotizaciones (
  id uuid default gen_random_uuid() primary key,
  solicitud_id uuid references solicitudes(id) on delete cascade,
  teacher_id uuid references profiles(id),
  teacher_name text,
  teacher_phone text,
  teacher_email text,
  teacher_rating numeric,
  precio numeric,
  duracion text,
  mensaje text,
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Mensajes de chat
create table messages (
  id uuid default gen_random_uuid() primary key,
  solicitud_id uuid references solicitudes(id) on delete cascade,
  sender_id uuid references profiles(id),
  sender_name text,
  sender_role text,
  content text,
  created_at timestamptz default now()
);

-- Transacciones de créditos
create table transactions (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles(id),
  type text check (type in ('credit_load','quote_cost','commission')),
  amount numeric,
  description text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table profiles     enable row level security;
alter table solicitudes  enable row level security;
alter table cotizaciones enable row level security;
alter table messages     enable row level security;
alter table transactions enable row level security;

-- Políticas básicas
create policy "Usuarios ven su propio perfil" on profiles for all using (auth.uid() = id);
create policy "Todos ven solicitudes abiertas" on solicitudes for select using (status = 'open' or student_id = auth.uid());
create policy "Estudiante crea solicitudes" on solicitudes for insert with check (student_id = auth.uid());
create policy "Profesor ve sus cotizaciones" on cotizaciones for all using (teacher_id = auth.uid() or solicitud_id in (select id from solicitudes where student_id = auth.uid()));
create policy "Ver mensajes del deal" on messages for all using (sender_id = auth.uid() or solicitud_id in (select id from solicitudes where student_id = auth.uid()));
create policy "Profesor ve sus transacciones" on transactions for all using (teacher_id = auth.uid());

-- =============================================
-- Registro y seguimiento de horas (clases y planes)
-- =============================================

create table horas_alumnos (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles(id) on delete cascade,
  nombre text not null,
  email text,
  telefono text,
  materia text,
  notas text,
  created_at timestamptz default now()
);

create table horas_planes (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles(id) on delete cascade,
  alumno_id uuid references horas_alumnos(id) on delete cascade,
  nombre text not null,
  materia text,
  horas_totales numeric not null check (horas_totales > 0),
  precio_total numeric default 0,
  fecha_inicio date default current_date,
  fecha_vencimiento date,
  notas text,
  archivado boolean default false,
  created_at timestamptz default now()
);

create table horas_pagos (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references horas_planes(id) on delete cascade,
  monto numeric not null check (monto > 0),
  fecha date default current_date,
  metodo text
);

create table horas_sesiones (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references profiles(id) on delete cascade,
  alumno_id uuid references horas_alumnos(id) on delete cascade,
  plan_id uuid references horas_planes(id) on delete set null,   -- null = clase suelta
  fecha date not null,
  hora_inicio time,
  duracion numeric not null check (duracion > 0),                -- horas
  materia text,
  tema text,
  notas text,
  estado text check (estado in ('realizada','falta_descuenta','falta_justificada')) default 'realizada',
  precio numeric default 0,                                      -- solo clases sueltas
  pagado boolean default false,
  created_at timestamptz default now()
);

alter table horas_alumnos  enable row level security;
alter table horas_planes   enable row level security;
alter table horas_pagos    enable row level security;
alter table horas_sesiones enable row level security;

create policy "Profesor gestiona sus alumnos" on horas_alumnos for all using (teacher_id = auth.uid());
create policy "Alumno ve su ficha" on horas_alumnos for select using (email = (select email from auth.users where id = auth.uid()));
create policy "Profesor gestiona sus planes" on horas_planes for all using (teacher_id = auth.uid());
create policy "Alumno ve sus planes" on horas_planes for select using (alumno_id in (select id from horas_alumnos where email = (select email from auth.users where id = auth.uid())));
create policy "Profesor gestiona pagos" on horas_pagos for all using (plan_id in (select id from horas_planes where teacher_id = auth.uid()));
create policy "Profesor gestiona sus sesiones" on horas_sesiones for all using (teacher_id = auth.uid());
create policy "Alumno ve sus sesiones" on horas_sesiones for select using (alumno_id in (select id from horas_alumnos where email = (select email from auth.users where id = auth.uid())));
