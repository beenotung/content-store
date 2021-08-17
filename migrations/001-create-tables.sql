-- Up

create table if not exists mime_type (
  id integer primary key
, media_type text not null unique
);

create table if not exists content (
  id integer primary key
, mime_type_id integer not null references mime_type(id)
, byte_size integer not null
, raw_data blob
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
  id integer primary key
, tag text unique
);

create table if not exists content_tag (
  tag_id integer not null references tag(id)
, content_id integer not null references content(id)
, unique(tag_id, content_id)
);

-- Down
drop table if exists tag;
drop table if exists sha256;
drop table if exists file;
drop table if exists content;
drop table if exists mime_type;
