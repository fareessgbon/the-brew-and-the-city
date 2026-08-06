-- §6 global receipt queue — a place for a future automatic-check step (OCR
-- total/date/merchant matching) to record why it couldn't clear a receipt on
-- its own. Nothing writes this yet (no OCR pipeline exists — see migration
-- 0015's comment on merchant_strings), so it stays null until that lands;
-- the admin queue just needs the column ready to display.
alter table public.visits
  add column if not exists auto_check_reason text;
