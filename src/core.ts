import { db } from './db'
import { detectMimeType } from './detect'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

export type StoreResult = number | Promise<number>

export type StoreContentOptions = {
  raw_data: Buffer
  media_type?: string
  tags?: string[]
}
export function storeContent({
  raw_data,
  media_type,
  tags,
}: StoreContentOptions): StoreResult {
  const hash = hashContent(raw_data)
  return useMediaType(
    media_type,
    raw_data,
    db.transaction(media_type => {
      const content_id = storeContentAndHash({
        raw_data,
        media_type,
        hash,
        inline_raw_data: true,
      })
      if (tags) storeTags(content_id, tags)
      return content_id
    }),
  )
}

export type ImportFileOptions = {
  // full path or relative path
  filename: string
  media_type?: string
  tags?: string[]
}
export function importFile({
  filename,
  media_type,
  tags,
}: ImportFileOptions): StoreResult {
  const raw_data = readFileSync(filename)
  const hash = hashContent(raw_data)
  return useMediaType(
    media_type,
    raw_data,
    db.transaction(media_type => {
      const content_id = storeContentAndHash({
        raw_data,
        hash,
        media_type,
        inline_raw_data: false,
      })
      if (tags) storeTags(content_id, tags)
      return content_id
    }),
  )
}

function useMediaType<T>(
  media_type: string | undefined,
  raw_data: Buffer,
  fn: (media_type: string) => T,
): T | Promise<T> {
  if (media_type) {
    return fn(media_type)
  }
  return detectMimeType(raw_data).then(result => fn(result.mime))
}

function storeTags(content_id: number, tags: string[]) {
  tags.forEach(tag => db.insert('tag', { tag, content_id }))
}

const select_hash_id = db.prepare(`
select content_id from sha256
where hash = ?
`)
function storeContentAndHash(args: {
  raw_data: Buffer
  media_type: string
  hash: Buffer
  inline_raw_data: boolean
}): number {
  // check if this content already exists
  const row = select_hash_id.get(args.hash)
  if (row) return row.content_id

  // store the content
  const content_id = db.insert('content', {
    raw_data: args.inline_raw_data ? args.raw_data : null,
    mime_type_id: getMimeTypeId(args.media_type),
  })
  db.insert('sha256', { hash: args.hash, content_id })

  return content_id
}

function hashContent(raw_data: Buffer): Buffer {
  const hash = createHash('sha256')
  hash.write(raw_data)
  return hash.digest()
}

const select_mime_type_id = db
  .prepare(
    `
select id from mime_type
where media_type = ?
`,
  )
  .pluck()

function getMimeTypeId(mimeType: string): number {
  const row = select_mime_type_id.get(mimeType)
  if (row) return row.id
  return db.insert('mime_type', { media_type: mimeType })
}
