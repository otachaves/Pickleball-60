-- Copa Imperial – Schema
-- Run this in Supabase SQL Editor

create table if not exists categorias (
  id   serial primary key,
  nome text not null,
  ordem int not null default 0
);

create table if not exists grupos (
  id           serial primary key,
  nome         text not null,
  categoria_id int  not null references categorias(id) on delete cascade
);

create table if not exists times (
  id       serial primary key,
  nome     text not null,
  grupo_id int  not null references grupos(id) on delete cascade
);

create table if not exists jogos (
  id               serial primary key,
  categoria_id     int  not null references categorias(id),
  grupo_id         int  not null references grupos(id),
  time_a_id        int  not null references times(id),
  time_b_id        int  not null references times(id),
  placar_a         int  default 0,
  placar_b         int  default 0,
  status           text not null default 'pendente' check (status in ('pendente','em_andamento','encerrado')),
  horario_previsto timestamptz,
  created_at       timestamptz default now()
);

-- Enable Realtime for jogos table
alter publication supabase_realtime add table jogos;
