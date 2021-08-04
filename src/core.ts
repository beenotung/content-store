import { db } from './db'
import { detectMimeType } from './detect'
import { createHash } from 'crypto'

export type StoreContentOptions = {
  raw_data: Buffer
  media_type?: string
  tags?: string[]
}
export function storeContent({
  raw_data,
  media_type,
  tags,
}: StoreContentOptions): number | Promise<number> {
  if (media_type) {
    return storeContentHelper(raw_data, media_type, tags)
  }
  return detectMimeType(raw_data).then(result => {
    return storeContentHelper(raw_data, result.mime, tags)
  })
}

function storeContentHelper(
  raw_data: Buffer,
  media_type: string,
  tags?: string[],
): number {
  return db.transaction(() => {
    const content_id = storeContentAndHash(raw_data, media_type)
    tags?.forEach(tag => {
      db.insert('tag', { tag, content_id })
    })
  })()
}

const select_hash_id = db.prepare(`
select content_id from sha256
where hash = ?
`)
function storeContentAndHash(raw_data: Buffer, media_type: string) {
  const hash = hashContent(raw_data)

  // check if this content already exists
  const row = select_hash_id.get(hash)
  if (row) return row.content_id

  // store the content
  const content_id = db.insert('content', {
    raw_data: raw_data,
    mime_type_id: getMimeTypeId(media_type),
  })
  db.insert('sha256', { hash, content_id })

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
