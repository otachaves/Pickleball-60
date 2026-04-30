-- Copa Imperial – Seed
-- ⚠️ Preencher os nomes reais após o sorteio
-- Run AFTER schema.sql

-- CATEGORIAS
insert into categorias (id, nome, ordem) values
  (1, 'Single Masculino',  1),
  (2, 'Dupla Mista',       2),
  (3, 'Dupla Masculina',   3),
  (4, 'Dupla Feminina',    4),
  (5, 'Quarteto',          5);

-- ─── SINGLE MASCULINO ──────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (1,  'Grupo A', 1),
  (2,  'Grupo B', 1),
  (3,  'Grupo C', 1),
  (4,  'Grupo D', 1);

insert into times (nome, grupo_id) values
  -- Grupo A
  ('Jogador A1', 1), ('Jogador A2', 1), ('Jogador A3', 1),
  -- Grupo B
  ('Jogador B1', 2), ('Jogador B2', 2), ('Jogador B3', 2),
  -- Grupo C
  ('Jogador C1', 3), ('Jogador C2', 3), ('Jogador C3', 3),
  -- Grupo D
  ('Jogador D1', 4), ('Jogador D2', 4), ('Jogador D3', 4);

-- ─── DUPLA MISTA ───────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (5,  'Grupo A', 2),
  (6,  'Grupo B', 2),
  (7,  'Grupo C', 2);

insert into times (nome, grupo_id) values
  ('Dupla Mista A1', 5), ('Dupla Mista A2', 5), ('Dupla Mista A3', 5), ('Dupla Mista A4', 5),
  ('Dupla Mista B1', 6), ('Dupla Mista B2', 6), ('Dupla Mista B3', 6), ('Dupla Mista B4', 6),
  ('Dupla Mista C1', 7), ('Dupla Mista C2', 7), ('Dupla Mista C3', 7);

-- ─── DUPLA MASCULINA ───────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (8,  'Grupo A', 3),
  (9,  'Grupo B', 3);

insert into times (nome, grupo_id) values
  ('Dupla Masc A1', 8), ('Dupla Masc A2', 8), ('Dupla Masc A3', 8),
  ('Dupla Masc B1', 9), ('Dupla Masc B2', 9), ('Dupla Masc B3', 9);

-- ─── DUPLA FEMININA ────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (10, 'Grupo Único', 4);

insert into times (nome, grupo_id) values
  ('Dupla Fem 1', 10), ('Dupla Fem 2', 10), ('Dupla Fem 3', 10),
  ('Dupla Fem 4', 10), ('Dupla Fem 5', 10);

-- ─── QUARTETO ──────────────────────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (11, 'Grupo Único', 5);

insert into times (nome, grupo_id) values
  ('Quarteto 1', 11), ('Quarteto 2', 11), ('Quarteto 3', 11), ('Quarteto 4', 11);

-- ─── GERAR JOGOS (round robin por grupo) ───────────────────
-- Cada time joga contra todos os outros do grupo 1 vez
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select
  g.categoria_id,
  g.id,
  t1.id,
  t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id;
