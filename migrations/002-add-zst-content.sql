-- Up

alter table content
  add column zst_data blob null;

-- Down
update table content
  set zst_data = null;
