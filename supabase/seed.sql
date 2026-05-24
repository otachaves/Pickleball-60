-- Copa Cidade Imperial – Seed
-- ⚠️ Preencher os nomes reais das duplas após o sorteio
-- Run AFTER schema.sql

-- CATEGORIAS
insert into categorias (id, nome, ordem, formato) values
  (1, 'Kids',  1, 'grupos_apenas'),
  (2, 'Open',  2, 'quartas'),
  (3, '40+',   3, 'semifinal'),
  (4, '50+',   4, 'semifinal'),
  (5, '60+',   5, 'grupos_apenas');

-- ─── KIDS ─────────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo Único', 1);

insert into times (nome, grupo_id) values
  ('Kids 1', 1), ('Kids 2', 1), ('Kids 3', 1), ('Kids 4', 1);

-- ─── OPEN ─────────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (2, 'Grupo A', 2),
  (3, 'Grupo B', 2),
  (4, 'Grupo C', 2);

insert into times (nome, grupo_id) values
  ('Open A1', 2), ('Open A2', 2), ('Open A3', 2),
  ('Open B1', 3), ('Open B2', 3), ('Open B3', 3),
  ('Open C1', 4), ('Open C2', 4), ('Open C3', 4);

-- ─── 40+ ──────────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (5, 'Grupo A', 3),
  (6, 'Grupo B', 3);

insert into times (nome, grupo_id) values
  ('40+ A1', 5), ('40+ A2', 5), ('40+ A3', 5),
  ('40+ B1', 6), ('40+ B2', 6), ('40+ B3', 6);

-- ─── 50+ ──────────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (7, 'Grupo A', 4),
  (8, 'Grupo B', 4);

insert into times (nome, grupo_id) values
  ('50+ A1', 7), ('50+ A2', 7), ('50+ A3', 7),
  ('50+ B1', 8), ('50+ B2', 8), ('50+ B3', 8);

-- ─── 60+ ──────────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (9, 'Grupo Único', 5);

insert into times (nome, grupo_id) values
  ('60+ 1', 9), ('60+ 2', 9), ('60+ 3', 9), ('60+ 4', 9);

-- ─── GERAR JOGOS (round robin por grupo) ──────────────────────
-- Cada dupla joga contra todas as outras do grupo 1 vez
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select
  g.categoria_id,
  g.id,
  t1.id,
  t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id;
