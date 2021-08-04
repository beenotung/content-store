-- Up

create table if not exists mime_type (
  id integer primary key
, media_type text not null unique
);

create table if not exists content (
  id integer primary key
, mime_type_id integer not null references mime_type(id)
);

create table if not exists file (
  filename text not null
, content_id integer not null references content(id)
);

create table if not exists sha256 (
  hash blob primary key
, content_id integer not null references content(id)
);

create table if not exists tag (
  tag text
, content_id integer not null references content(id)
);

-- Down
drop table if exists tag;
drop table if exists sha256;
drop table if exists file;
drop table if exists content;
drop table if exists mime_type;
