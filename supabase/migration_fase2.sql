-- Fase 2 migration — run in Supabase SQL Editor

-- Allow grupo_id to be null for elimination games
alter table jogos alter column grupo_id drop not null;

-- Add round and bracket position columns
alter table jogos
  add column if not exists rodada text not null default 'grupos'
    check (rodada in ('grupos','quartas','semifinal','final','terceiro_lugar')),
  add column if not exists bracket_slot int;
