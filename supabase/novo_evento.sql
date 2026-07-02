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
--    1. Open (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada = 4)
--    2. 40+  (8) → 2 grupos de 4    → Semifinal (top 2 de cada = 4)
--    3. 50+  (6) → 1 grupo único    → SEM mata-mata (1º = mais pontos)
--    4. 60+  (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada = 4)
--  Jogo: game único até 15 pontos (vantagem de 2).
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
  (1, 'Dupla Mista — Open', 1, 'semifinal',     null),
  (2, 'Dupla Mista — 40+',  2, 'semifinal',     null),
  (3, 'Dupla Mista — 50+',  3, 'grupos_apenas', null),
  (4, 'Dupla Mista — 60+',  4, 'semifinal',     null);

-- ─── OPEN (cat 1) — 2 grupos: A com 5, B com 4 ─────────────────
insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo A', 1), (2, 'Grupo B', 1);
insert into times (nome, grupo_id) values
  -- Grupo A (5)
  ('Otávio Chaves / Nathália Martins', 1),
  ('Antônio Nóbrega / Larissa Damasceno Andrade', 1),
  ('Bruno Barbosa Ramos / Claudia Junger', 1),
  ('Helios Pavese / Juliana Antunes', 1),
  ('Javier Lago Alonso / Mariele Cristina Stamm', 1),
  -- Grupo B (4)
  ('Mauro Grillo / Roberta Barbosa', 2),
  ('Maxwell Sousa / Mirian Tanus', 2),
  ('Pedro Jahara / Paula Jahara', 2),
  ('Rogerio Arongaus / Alexandra Nazario', 2);

-- ─── 40+ (cat 2) — 2 grupos de 4 ───────────────────────────────
insert into grupos (id, nome, categoria_id) values
  (3, 'Grupo A', 2), (4, 'Grupo B', 2);
insert into times (nome, grupo_id) values
  ('Maria Clara / Padre Carlos', 3),
  ('Humberto Medrado / Vanessa Quintanilha', 3),
  ('Marcio Dos Santos Silva / Priscila Novaes dos Santos', 3),
  ('Otavio Chaves / Cláudia Junger', 3),
  ('Amaury Jr / Liliana Nogueira', 4),
  ('Jonas Augusto de Souza Filho / Carla Lebre', 4),
  ('Mauro Grillo / Ana Paula Neiva', 4),
  ('Paulo Marcelo Montesanto / Mariele Cristina Stamm', 4);

-- ─── 50+ (cat 3) — 1 grupo único (sem mata-mata) ───────────────
insert into grupos (id, nome, categoria_id) values
  (5, 'Grupo Único', 3);
insert into times (nome, grupo_id) values
  ('Mauro Grillo / Maria Clara', 5),
  ('Bruno Barros / Luciene Caruso', 5),
  ('Fábio Calderano / Claudia Canavarro', 5),
  ('Humberto Medrado / Monica Pope', 5),
  ('Ricardo Monteiro / Patrícia Guyer', 5),
  ('Rogerio Arongaus / Alexandra Nazario', 5);

-- ─── 60+ (cat 4) — 2 grupos: A com 5, B com 4 ──────────────────
insert into grupos (id, nome, categoria_id) values
  (6, 'Grupo A', 4), (7, 'Grupo B', 4);
insert into times (nome, grupo_id) values
  -- Grupo A (5)
  ('Amaury Jr / Miriam', 6),
  ('Fábio Calderano / Claudia Canavarro', 6),
  ('Javier Lago Alonso / Eliane Lago Alonso', 6),
  ('Julio Monteiro / Anna Tanaka', 6),
  ('Marcelo Barbieri Bastos / Lilian Maria Pessoa Barbieri Bastos', 6),
  -- Grupo B (4)
  ('Mário Moreira / Walkiria', 7),
  ('Mauro Grillo / Mônica', 7),
  ('Paulo Marcelo Montesanto / Carla Lebre', 7),
  ('Ricardo Monteiro / Ana Paula Neiva', 7);

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
