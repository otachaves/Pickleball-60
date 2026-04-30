-- Migration fase2b
-- Run in Supabase SQL Editor AFTER migration_fase2.sql

-- Add formato to categorias
alter table categorias
  add column if not exists formato text not null default 'quartas'
  check (formato in ('grupos_apenas', 'quartas'));

-- Dupla Feminina (id=4) e Quarteto (id=5) → sem eliminatória
update categorias set formato = 'grupos_apenas' where id in (4, 5);

-- ── Fix Dupla Masculina: 2 grupos → 3 grupos de 4 ──────────

-- Remove jogos e times antigos da Dupla Masculina
delete from jogos where categoria_id = 3;
delete from times where grupo_id in (8, 9);
delete from grupos where categoria_id = 3;

-- Inserir 3 grupos
insert into grupos (id, nome, categoria_id) values
  (8,  'Grupo A', 3),
  (9,  'Grupo B', 3),
  (12, 'Grupo C', 3);

-- Inserir 4 times por grupo (placeholder — trocar após o sorteio)
insert into times (nome, grupo_id) values
  ('Dupla Masc A1', 8), ('Dupla Masc A2', 8), ('Dupla Masc A3', 8), ('Dupla Masc A4', 8),
  ('Dupla Masc B1', 9), ('Dupla Masc B2', 9), ('Dupla Masc B3', 9), ('Dupla Masc B4', 9),
  ('Dupla Masc C1', 12), ('Dupla Masc C2', 12), ('Dupla Masc C3', 12), ('Dupla Masc C4', 12);

-- Gerar jogos round robin para os 3 grupos
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t1.id, t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id
where g.categoria_id = 3;
