-- ═══════════════════════════════════════════════════════════════
--  TEMPLATE: começar um NOVO evento
--  Rode este arquivo (SQL Editor) sempre que for iniciar um torneio.
--  Pré-requisito: já ter rodado `migration_evento.sql` uma vez.
--
--  ⚠️ APAGA o torneio anterior (categorias/grupos/duplas/jogos) e
--     carrega o novo. As infos ficam na tabela `evento`.
--     Nada de código precisa ser alterado.
--
--  Esta versão vem com o torneio DUPLA MISTA — grupos já SORTEADOS:
--    1. Open (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada = 4)
--    2. 40+  (8) → 2 grupos de 4    → Semifinal (top 2 de cada = 4)
--    3. 50+  (6) → 1 grupo único    → SEM mata-mata (1º = mais pontos)
--    4. 60+  (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada = 4)
--  Jogo: game único até 15 pontos (vantagem de 2).
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. Limpar torneio anterior ────────────────────────────────
truncate table jogos, times, grupos, categorias restart identity cascade;

-- ─── 1. Infos do evento (aba Informações) ──────────────────────
update evento set
  nome_curto             = 'Copa Imperial',
  titulo                 = '🏆 Copa Imperial — Dupla Mista',
  subtitulo              = 'Torneio de Pickleball',
  formato_jogo           = 'Game único até 15 pontos, com vantagem de 2 (em caso de 14 a 14, segue até abrir 2 de diferença)',
  programacao            = '[
    {"quando":"Sáb 8h",   "o_que":"Quadras abertas",                    "detalhe":""},
    {"quando":"Sáb 9h",   "o_que":"Início do torneio — Categoria 60+",  "detalhe":""},
    {"quando":"Sáb 11h30","o_que":"Categoria 50+",                      "detalhe":"horário aproximado"},
    {"quando":"Sáb 14h",  "o_que":"Categoria 40+",                      "detalhe":""},
    {"quando":"Dom 9h",   "o_que":"Categoria Open",                     "detalhe":""}
  ]'::jsonb,
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
  (1, 'Dupla Mista — Open', 1, 'semifinal',     'Domingo · 9h'),
  (2, 'Dupla Mista — 40+',  2, 'semifinal',     'Sábado · 14h'),
  (3, 'Dupla Mista — 50+',  3, 'grupos_apenas', 'Sábado · ~11h30'),
  (4, 'Dupla Mista — 60+',  4, 'semifinal',     'Sábado · 9h');

-- ─── OPEN (cat 1) — sorteio: A com 5, B com 4 ──────────────────
insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo A', 1), (2, 'Grupo B', 1);
insert into times (nome, grupo_id) values
  ('Rogerio Arongaus / Alexandra Nazario', 1),
  ('Helios Pavese / Juliana Antunes', 1),
  ('Bruno Barbosa Ramos / Claudia Junger', 1),
  ('Maxwell Sousa / Mirian Tanus', 1),
  ('Otávio Chaves / Nathália Martins', 1),
  ('Mauro Grillo / Roberta Barbosa', 2),
  ('Pedro Jahara / Paula Jahara', 2),
  ('Antônio Nóbrega / Larissa Damasceno Andrade', 2),
  ('Javier Lago Alonso / Mariele Cristina Stamm', 2);

-- ─── 40+ (cat 2) — sorteio: A com 4, B com 4 ───────────────────
insert into grupos (id, nome, categoria_id) values
  (3, 'Grupo A', 2), (4, 'Grupo B', 2);
insert into times (nome, grupo_id) values
  ('Jonas Augusto de Souza Filho / Carla Lebre', 3),
  ('Amaury Jr / Liliana Nogueira', 3),
  ('Humberto Medrado / Vanessa Quintanilha', 3),
  ('Mauro Grillo / Ana Paula Neiva', 3),
  ('Paulo Marcelo Montesanto / Mariele Cristina Stamm', 4),
  ('Otavio Chaves / Cláudia Junger', 4),
  ('Marcio Dos Santos Silva / Priscila Novaes dos Santos', 4),
  ('Maria Clara / Padre Carlos', 4);

-- ─── 50+ (cat 3) — 1 grupo único (sem mata-mata) ───────────────
insert into grupos (id, nome, categoria_id) values
  (5, 'Grupo Único', 3);
insert into times (nome, grupo_id) values
  ('Bruno Barros / Luciene Caruso', 5),
  ('Fábio Calderano / Claudia Canavarro', 5),
  ('Rogerio Arongaus / Alexandra Nazario', 5),
  ('Humberto Medrado / Monica Pope', 5),
  ('Ricardo Monteiro / Patrícia Guyer', 5),
  ('Mauro Grillo / Maria Clara', 5);

-- ─── 60+ (cat 4) — sorteio: A com 5, B com 4 ───────────────────
insert into grupos (id, nome, categoria_id) values
  (6, 'Grupo A', 4), (7, 'Grupo B', 4);
insert into times (nome, grupo_id) values
  ('Mauro Grillo / Mônica', 6),
  ('Ricardo Monteiro / Ana Paula Neiva', 6),
  ('Fábio Calderano / Claudia Canavarro', 6),
  ('Julio Monteiro / Anna Tanaka', 6),
  ('Javier Lago Alonso / Eliane Lago Alonso', 6),
  ('Mário Moreira / Walkiria', 7),
  ('Marcelo Barbieri Bastos / Lilian Maria Pessoa Barbieri Bastos', 7),
  ('Paulo Marcelo Montesanto / Carla Lebre', 7),
  ('Amaury Jr / Miriam', 7);

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
