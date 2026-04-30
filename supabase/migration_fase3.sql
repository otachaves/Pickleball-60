-- Copa Imperial – Migration Fase 3 (comprehensive)
-- Safe to run even if previous migrations were NOT run
-- Run in Supabase SQL Editor

-- ── 1. Jogos: nullable grupo_id + colunas de bracket ───────
alter table jogos alter column grupo_id drop not null;

alter table jogos
  add column if not exists rodada     text not null default 'grupos',
  add column if not exists bracket_slot int;

alter table jogos drop constraint if exists jogos_rodada_check;
alter table jogos add constraint jogos_rodada_check check (
  rodada in ('grupos','quartas','semifinal','final','terceiro_lugar','wildcard')
);

-- ── 2. Categorias: formato ──────────────────────────────────
alter table categorias add column if not exists formato text not null default 'quartas';

alter table categorias drop constraint if exists categorias_formato_check;
alter table categorias add constraint categorias_formato_check check (
  formato in ('grupos_apenas','quartas','semifinal')
);

update categorias set formato = 'quartas'      where id in (1, 2);
update categorias set formato = 'semifinal'    where id = 3;
update categorias set formato = 'grupos_apenas' where id in (4, 5);

-- ── 3. Single Masculino: 4 grupos de 3 → 3 grupos de 4 ─────
delete from jogos where categoria_id = 1;
delete from times where grupo_id in (select id from grupos where categoria_id = 1);
delete from grupos where categoria_id = 1;

insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo A', 1),
  (2, 'Grupo B', 1),
  (3, 'Grupo C', 1);

insert into times (nome, grupo_id) values
  ('Jogador A1', 1), ('Jogador A2', 1), ('Jogador A3', 1), ('Jogador A4', 1),
  ('Jogador B1', 2), ('Jogador B2', 2), ('Jogador B3', 2), ('Jogador B4', 2),
  ('Jogador C1', 3), ('Jogador C2', 3), ('Jogador C3', 3), ('Jogador C4', 3);

insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t1.id, t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id
where g.categoria_id = 1;

-- ── 4. Dupla Masculina: reset → 2 grupos de 3 ──────────────
delete from jogos where categoria_id = 3;
delete from times where grupo_id in (select id from grupos where categoria_id = 3);
delete from grupos where categoria_id = 3;

insert into grupos (id, nome, categoria_id) values
  (8, 'Grupo A', 3),
  (9, 'Grupo B', 3);

insert into times (nome, grupo_id) values
  ('Dupla Masc A1', 8), ('Dupla Masc A2', 8), ('Dupla Masc A3', 8),
  ('Dupla Masc B1', 9), ('Dupla Masc B2', 9), ('Dupla Masc B3', 9);

insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t1.id, t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id
where g.categoria_id = 3;

-- ── 5. Realtime ─────────────────────────────────────────────
alter publication supabase_realtime add table jogos;
