-- ═══════════════════════════════════════════════════════════════
--  TEMPLATE: começar um NOVO evento
--  Rode este arquivo (SQL Editor) sempre que for iniciar um torneio.
--  Pré-requisito: já ter rodado `migration_evento.sql` uma vez.
--
--  ⚠️ APAGA o torneio anterior (categorias/grupos/duplas/jogos) e
--     carrega o novo. As infos ficam na tabela `evento`.
--     Nada de código precisa ser alterado.
--
--  Esta versão vem com a COPA IMPERIAL 002 — grupos já SORTEADOS:
--    1. Single Open            (10) → 2 grupos de 5 → Semifinal (top 2 de cada)
--    2. Dupla Mista 50+         (5) → 1 grupo único → SEM mata-mata (1º = mais pontos)
--    3. Dupla Masculina 50+     (3) → 1 grupo único, DOIS TURNOS → SEM mata-mata
--    4. Dupla Mista Open        (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada)
--    5. Dupla Masculina Open    (9) → 2 grupos (5 + 4) → Semifinal (top 2 de cada)
--  Jogo: rally score, partida até 11 pontos, com vantagem de 2.
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. Limpar torneio anterior ────────────────────────────────
truncate table jogos, times, grupos, categorias restart identity cascade;

-- ─── 1. Infos do evento (aba Informações) ──────────────────────
update evento set
  nome_curto             = 'Copa Imperial',
  titulo                 = '🏆 Copa Imperial 002',
  subtitulo              = 'Torneio de Pickleball',
  formato_jogo           = 'Rally score — partida única até 11 pontos, com vantagem de 2 (em caso de 10 a 10, segue até abrir 2 de diferença)',
  programacao            = '[
    {"quando":"Sáb 8h",    "o_que":"Abertura oficial do torneio",     "detalhe":""},
    {"quando":"Sáb 8h30",  "o_que":"Single Open",                     "detalhe":""},
    {"quando":"Sáb 12h30", "o_que":"Dupla Mista 50+",                 "detalhe":"não antes desse horário"},
    {"quando":"Sáb 15h",   "o_que":"Dupla Masculina 50+",             "detalhe":"não antes desse horário"},
    {"quando":"Dom 9h",    "o_que":"Abertura oficial",                "detalhe":""},
    {"quando":"Dom 9h30",  "o_que":"Dupla Mista Open",                "detalhe":""},
    {"quando":"Dom 14h",   "o_que":"Dupla Masculina Open",            "detalhe":"não antes desse horário"}
  ]'::jsonb,
  local_nome             = 'Arena Paróquia Santa Clara',
  local_endereco         = 'R. Cel. Veiga, 1130 — Cohab',
  local_cidade           = 'Petrópolis, RJ',
  local_maps_url         = 'https://maps.google.com/?q=R.+Cel.+Veiga%2C+1130%2C+Petr%C3%B3polis%2C+RJ',
  estacionamento         = '🅿️ Estacionamento no local',
  contato_nome           = 'Mauro',
  contato_whatsapp       = '5524988050643',
  contato_whatsapp_label = '+55 24 98805-0643'
where id = 1;

-- ─── 2. Categorias (formato + horário) ─────────────────────────
insert into categorias (id, nome, ordem, formato, horario) values
  (1, 'Single — Open',           1, 'semifinal',     'Sábado · 8h30'),
  (2, 'Dupla Mista — 50+',       2, 'grupos_apenas', 'Sábado · ~12h30'),
  (3, 'Dupla Masculina — 50+',   3, 'grupos_apenas', 'Sábado · ~15h'),
  (4, 'Dupla Mista — Open',      4, 'semifinal',     'Domingo · 9h30'),
  (5, 'Dupla Masculina — Open',  5, 'semifinal',     'Domingo · ~14h');

-- ─── SINGLE OPEN (cat 1) — 2 grupos de 5 ───────────────────────
insert into grupos (id, nome, categoria_id) values
  (1, 'Grupo A', 1), (2, 'Grupo B', 1);
insert into times (nome, grupo_id) values
  ('Mauro Grillo', 1),
  ('Helios Pavese', 1),
  ('Cristina Verta', 1),
  ('Rogério Arongaus', 1),
  ('Otavio Chaves', 1),
  ('Alney Alexandre Alves Antunes', 2),
  ('Ricardo Monteiro', 2),
  ('Anna', 2),
  ('Pedro Ferrer Brandão', 2),
  ('Vitor', 2);

-- ─── DUPLA MISTA 50+ (cat 2) — 1 grupo único (sem mata-mata) ───
insert into grupos (id, nome, categoria_id) values
  (3, 'Grupo Único', 2);
insert into times (nome, grupo_id) values
  ('Humberto Medrado / Mirian Tanus', 3),
  ('Mauro / Monica Pope', 3),
  ('Rogério Arongaus / Alexandra Nazário', 3),
  ('Júlio Souza / Cristina Verta', 3),
  ('Maria Clara / Marcos Paulo', 3);

-- ─── DUPLA MASCULINA 50+ (cat 3) — grupo único, DOIS TURNOS ────
insert into grupos (id, nome, categoria_id) values
  (4, 'Grupo Único', 3);
insert into times (nome, grupo_id) values
  ('Rogério Arongaus / Ricardo Monteiro', 4),
  ('Alney / Marcos Paulo', 4),
  ('Mauro / Humberto', 4);

-- ─── DUPLA MISTA OPEN (cat 4) — A com 5, B com 4 ───────────────
insert into grupos (id, nome, categoria_id) values
  (5, 'Grupo A', 4), (6, 'Grupo B', 4);
insert into times (nome, grupo_id) values
  ('Otavio / Nathalia', 5),
  ('Helios / Anna', 5),
  ('Bruno Barbosa Ramos / A definir', 5),
  ('Júlio Souza / Cristina Verta', 5),
  ('Vitor / Isabella', 5),
  ('Rogério Arongaus / Alexandra Nazário', 6),
  ('Maria Clara / Marcelo Barbieri', 6),
  ('Nilson Klippel / Mirian Tanus', 6),
  ('Mauro / Vanessa', 6);

-- ─── DUPLA MASCULINA OPEN (cat 5) — A com 5, B com 4 ───────────
insert into grupos (id, nome, categoria_id) values
  (7, 'Grupo A', 5), (8, 'Grupo B', 5);
insert into times (nome, grupo_id) values
  ('Otavio / Vitor', 7),
  ('Bruno Barbosa Ramos / Ignácio', 7),
  ('Rogério Arongaus / Ricardo Monteiro', 7),
  ('Mauro Grillo / Marcelo Barbieri', 7),
  ('Alney Antunes / Helios Pavese', 7),
  ('Rafael Thebald / Bernardo Chaves', 8),
  ('Luciano Pessoa / Daniel Mettrau', 8),
  ('Neto Rabello / Felipe Machado', 8),
  ('Fernando Macedo / Victor Reis', 8);

-- ─── 3. Gerar jogos (round robin por grupo) ────────────────────
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t1.id, t2.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id;

-- 2º turno da Dupla Masculina 50+ (todos jogam duas vezes entre si)
insert into jogos (categoria_id, grupo_id, time_a_id, time_b_id)
select g.categoria_id, g.id, t2.id, t1.id
from times t1
join times t2 on t1.grupo_id = t2.grupo_id and t1.id < t2.id
join grupos g on g.id = t1.grupo_id
where g.categoria_id = 3;

-- ─── 4. Reajustar sequences (inserimos ids explícitos) ─────────
select setval('categorias_id_seq', (select max(id) from categorias));
select setval('grupos_id_seq',     (select max(id) from grupos));
select setval('times_id_seq',      (select max(id) from times));
