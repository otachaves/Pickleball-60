-- Migration fase 4: reordenar categorias
-- Run in Supabase SQL Editor

-- Nova ordem:
-- 1. Single Masculino
-- 2. Dupla Feminina
-- 3. Dupla Masculina
-- 4. Dupla Mista
-- 5. Quarteto

update categorias set ordem = 1 where id = 1; -- Single Masculino
update categorias set ordem = 2 where id = 4; -- Dupla Feminina
update categorias set ordem = 3 where id = 3; -- Dupla Masculina
update categorias set ordem = 4 where id = 2; -- Dupla Mista
update categorias set ordem = 5 where id = 5; -- Quarteto
