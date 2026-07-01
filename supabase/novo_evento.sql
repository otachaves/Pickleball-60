-- ═══════════════════════════════════════════════════════════════
--  TEMPLATE: começar um NOVO evento
--  Rode este arquivo (SQL Editor) sempre que for iniciar um torneio.
--  Pré-requisito: já ter rodado `migration_evento.sql` uma vez.
--
--  ⚠️ APAGA o torneio anterior (categorias/grupos/duplas/jogos) e
--     carrega o novo. As infos ficam na tabela `evento`.
--     Nada de código precisa ser alterado.
--
--  Esta versão já vem preenchida com o torneio DUPLA MISTA:
--    1. Open (9) → 3 grupos de 3 → Quartas + 2 wildcards
--    2. 40+  (8) → 2 grupos de 4 → Semifinal
--    3. 50+  (6) → 2 grupos de 3 → Semifinal
--    4. 60+  (9) → 3 grupos de 3 → Quartas + 2 wildcards
--  Jogo: game único até 15 pontos.
--  (A distribuição dos grupos é uma SUGESTÃO — ajuste se o sorteio mudar.)
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. Limpar torneio anterior ────────────────────────────────
truncate table jogos, times, grupos, categorias restart identity cascade;

-- ─── 1. Infos do evento (aba Informações) ──────────────────────
update evento set
  nome_curto             = 'Copa Imperial',
  titulo                 = '🏆 Copa Imperial — Dupla Mista',
  subtitulo              = 'Torneio de Pickleball',
  formato_jogo           = 'Game único até 15 pontos, com vantagem de 2 (em caso de 14 a 14, segue até abrir 2 de diferença)',
  programacao            = '[]'::jsonb,   -- preencha: [{"quando":"...","o_que":"...","detalhe":"..."}]
  local_nome             = 'Quadra Paróquia Santa Clara',
  local_endereco         = 'Tv. João Kneipp, 80 — Valparaíso',
  local_cidade           = 'Petrópolis, RJ — 25655-480',
  local_maps_url         = 'https://maps.google.com/?q=Tv.+Jo%C3%A3o+Kneipp%2C+80+-+Valpara%C3%ADso%2C+Petr%C3%B3polis+-+RJ%2C+25655-480',
  estacionamento         = '🅿️ Estacionamento no local',
  contato_nome           = 'Mauro',
  contato_whatsapp       = '5524988050643',
  contato_whatsapp_label = '+55 24 98805-0643'
where id = 1;

-- ─── 2. Categorias (formato + horário) ─────────────────────────
insert into categorias (id, nome, ordem, formato, horario) values
  (1, 'Dupla Mista — Open', 1, 'quartas',   null),
  (2, 'Dupla Mista — 40+',  2, 'semifinal', null),
  (3, 'Dupla Mista — 50+',  3, 'semifinal', null),
  (4, 'Dupla Mista — 60+',  4, 'quartas',   null);

-- ─── OPEN (cat 1) — 3 grupos de 3 ──────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo A', 1), (2, 'Grupo B', 1), (3, 'Grupo C', 1);
insert into times (nome, grupo_id) values
  ('Otávio Chaves / Nathália Martins', 1),
  ('Helios Pavese / Juliana Antunes', 1),
  ('Maxwell Sousa / Mirian Tanus', 1),
  ('Antônio Nóbrega / Larissa Damasceno Andrade', 2),
  ('Javier Lago Alonso / Mariele Cristina Stamm', 2),
  ('Pedro Jahara / Paula Jahara', 2),
  ('Bruno Barbosa Ramos / Claudia Junger', 3),
  ('Mauro Grillo / Roberta Barbosa', 3),
  ('Rogerio Arongaus / Alexandra Nazario', 3);

-- ─── 40+ (cat 2) — 2 grupos de 4 ───────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (4, 'Grupo A', 2), (5, 'Grupo B', 2);
insert into times (nome, grupo_id) values
  ('Maria Clara / Padre Carlos', 4),
  ('Humberto Medrado / Vanessa Quintanilha', 4),
  ('Marcio Dos Santos Silva / Priscila Novaes dos Santos', 4),
  ('Otavio Chaves / Cláudia Junger', 4),
  ('Amaury Jr / Liliana Nogueira', 5),
  ('Jonas Augusto de Souza Filho / Carla Lebre', 5),
  ('Mauro Grillo / Ana Paula Neiva', 5),
  ('Paulo Marcelo Montesanto / Mariele Cristina Stamm', 5);

-- ─── 50+ (cat 3) — 2 grupos de 3 ───────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (6, 'Grupo A', 3), (7, 'Grupo B', 3);
insert into times (nome, grupo_id) values
  ('Mauro Grillo / Maria Clara', 6),
  ('Fábio Calderano / Claudia Canavarro', 6),
  ('Ricardo Monteiro / Patrícia Guyer', 6),
  ('Bruno Barros / Luciene Caruso', 7),
  ('Humberto Medrado / Monica Pope', 7),
  ('Rogerio Arongaus / Alexandra Nazario', 7);

-- ─── 60+ (cat 4) — 3 grupos de 3 ───────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (8, 'Grupo A', 4), (9, 'Grupo B', 4), (10, 'Grupo C', 4);
insert into times (nome, grupo_id) values
  ('Amaury Jr / Miriam', 8),
  ('Julio Monteiro / Anna Tanaka', 8),
  ('Mauro Grillo / Mônica', 8),
  ('Fábio Calderano / Claudia Canavarro', 9),
  ('Marcelo Barbieri Bastos / Lilian Maria Pessoa Barbieri Bastos', 9),
  ('Paulo Marcelo Montesanto / Carla Lebre', 9),
  ('Javier Lago Alonso / Eliane Lago Alonso', 10),
  ('Mário Moreira / Walkiria', 10),
  ('Ricardo Monteiro / Ana Paula Neiva', 10);

-- ─── 3. Gerar jogos (round robin por grupo) ────────────────────
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t1.id, t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id;

-- ─── 4. Reajustar sequences (inserimos ids explícitos) ─────────
select setval('categorias_id_seq', (select max(id) from categorias));
select setval('grupos_id_seq',     (select max(id) from grupos));
select setval('times_id_seq',      (select max(id) from times));
