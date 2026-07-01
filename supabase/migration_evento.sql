-- ═══════════════════════════════════════════════════════════════
--  Migration: torna o app reutilizável para vários eventos
--  RODAR UMA ÚNICA VEZ no Supabase atual (SQL Editor).
--  É aditiva e já preenche os dados da Copa Imperial atual,
--  então nada quebra depois de rodar.
--
--  Depois desta migration, cada NOVO evento é só rodar
--  `novo_evento.sql` (não precisa mexer em código nunca mais).
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Horário por categoria (substitui o lib/horarios.ts) ────
alter table categorias add column if not exists horario text;

-- Backfill dos horários atuais da Copa Imperial (por nome)
update categorias set horario = '2 de maio · a partir de 08:00' where nome = 'Single Masculino';
update categorias set horario = '2 de maio · a partir de 13:00' where nome = 'Dupla Feminina';
update categorias set horario = '2 de maio · a partir de 15:00' where nome = 'Dupla Masculina';
update categorias set horario = '3 de maio · a partir de 09:00' where nome = 'Dupla Mista';
update categorias set horario = '3 de maio · a partir de 13:00' where nome = 'Quarteto';

-- ─── 2. Tabela evento (uma linha, id=1) ────────────────────────
create table if not exists evento (
  id                     int primary key default 1,
  nome_curto             text not null default 'Torneio',
  titulo                 text not null default '🏆 Torneio',
  subtitulo              text not null default 'Torneio de Pickleball',
  formato_jogo           text,
  programacao            jsonb not null default '[]'::jsonb,
  local_nome             text,
  local_endereco         text,
  local_cidade           text,
  local_maps_url         text,
  estacionamento         text,
  contato_nome           text,
  contato_whatsapp       text,
  contato_whatsapp_label text,
  constraint evento_single_row check (id = 1)
);

-- Backfill com os dados da Copa Imperial 60+ atual
insert into evento (
  id, nome_curto, titulo, subtitulo, formato_jogo, programacao,
  local_nome, local_endereco, local_cidade, local_maps_url, estacionamento,
  contato_nome, contato_whatsapp, contato_whatsapp_label
) values (
  1,
  'Copa Imperial',
  '🏆 Copa Imperial 60+',
  'Torneio de Pickleball',
  null,
  '[
    {"quando": "1 maio",   "o_que": "Open Play", "detalhe": "A partir das 15:00"},
    {"quando": "2-3 maio", "o_que": "Torneio",   "detalhe": "Veja horário de cada categoria nas abas"}
  ]'::jsonb,
  'Quadra Paróquia Santa Clara',
  'Tv. João Kneipp, 80 — Valparaíso',
  'Petrópolis, RJ — 25655-480',
  'https://maps.google.com/?q=Tv.+Jo%C3%A3o+Kneipp%2C+80+-+Valpara%C3%ADso%2C+Petr%C3%B3polis+-+RJ%2C+25655-480',
  '🅿️ Estacionamento no local',
  'Mauro',
  '5524988050643',
  '+55 24 98805-0643'
)
on conflict (id) do nothing;

-- Realtime (idempotente — ignore erro se já estiver adicionada)
-- alter publication supabase_realtime add table jogos;
