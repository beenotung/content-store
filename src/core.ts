import { db } from './db'
import { detectMimeType } from './detect'

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

export function storeContent(raw_data: Buffer) {
  detectMimeType(raw_data).then(result => {
    db.transaction(() => {
      // TODO check if this content already exists
      db.insert('content', {
        raw_data,
        mime_type_id: getMimeTypeId(result.mime),
      })
      // TODO store hash
    })()
  })
}
