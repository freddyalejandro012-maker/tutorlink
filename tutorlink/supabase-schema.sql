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
