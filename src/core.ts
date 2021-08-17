import { detectMimeType } from './detect'
import { createHash } from 'crypto'
import { unlinkSync, statSync, readdirSync, readFileSync } from 'fs'
import { DBInstance } from 'better-sqlite3-schema'
import { join } from 'path'

export type StoreResult = number | Promise<number>

export type StoreContentOptions = {
  raw_data: Buffer
  media_type?: string
  tags?: string[]
}

export type ImportFileOptions = {
  // full path or relative path
  filename: string
  media_type?: string
  tags?: string[]
}

export type ImportDirectoryOptions = {
  dir: string
  tags?: string[]
  recursive?: boolean // default false
  extname?: string // default is any
  filterFile?: (fullPath: string, filename: string, dir: string) => boolean // default is true for all files
  filterDirectory?: (fullPath: string, filename: string, dir: string) => boolean // default is true for all directories
}

export type RemoveExistingContentOptions = {
  dir: string
  recursive?: boolean // default false
  verbose?: boolean // default false
}

export type LoadContentResult = {
  raw_data: Buffer
  media_type: string
}

export type LoadFileResult = {
  filename: string
  media_type: string
}

export class ContentStore {
  private select_hash_id = this.db.prepare(`
select content_id from sha256
where hash = ?
`)

  private select_mime_type_id = this.db.prepare(
    `
select id from mime_type
where media_type = ?
`,
  )

  private select_content = this.db.prepare(`
select
  content.raw_data
, mime_type.media_type
from content
inner join mime_type on mime_type.id = content.mime_type_id
where content.id = ?
`)

  private select_file = this.db.prepare(`
select
  file.filename
, mime_type.media_type
from content
inner join file on file.content_id = content.id
inner join mime_type on mime_type.id = content.mime_type_id
where content.id = ?
`)

  private select_filename = this.db
    .prepare(
      `
select
  file.filename
from file
where file.content_id = ?
`,
    )
    .pluck()

  private insert_file = this.db.prepare(`
insert into file (filename, content_id)
values (:filename, :content_id)
`)

  private insert_tag = this.db.prepare(`
insert into tag (tag, content_id)
values (:tag, :content_id)
`)

  private insert_content = this.db.prepare(`
insert into content (raw_data, mime_type_id)
values (:raw_data, :mime_type_id)
`)

  private select_by_filename = this.db.prepare(`
select content_id from file
where filename = ?
limit 1
`)

  constructor(public db: DBInstance) {}

  storeContent({
    raw_data,
    media_type,
    tags,
  }: StoreContentOptions): StoreResult {
    const hash = hashContent(raw_data)
    const filename = undefined
    return useMediaType(
      media_type,
      raw_data,
      filename,
      this.db.transaction(media_type => {
        const content_id = this.storeContentAndHash({
          raw_data,
          media_type,
          hash,
          inline_raw_data: true,
        })
        if (tags) this.storeTags(content_id, tags)
        return content_id
      }),
    )
  }

  importDirectory({
    dir,
    recursive,
    extname,
    filterFile,
    filterDirectory,
    tags,
  }: ImportDirectoryOptions) {
    const dirStack: string[] = [dir]
    for (;;) {
      const dir = dirStack.pop()
      if (!dir) break
      const files = readdirSync(dir)
      files.forEach(filename => {
        const fullPath = join(dir, filename)
        const stat = statSync(fullPath)
        if (stat.isDirectory() && recursive) {
          if (filterDirectory && !filterDirectory(fullPath, filename, dir)) {
            return
          }
          dirStack.push(fullPath)
          return
        }
        if (stat.isFile()) {
          if (filterFile && !filterFile(fullPath, filename, dir)) return
          if (extname && !filename.endsWith(extname)) return
          this.importFile({ filename: fullPath, tags })
        }
      })
    }
  }

  importFile({ filename, media_type, tags }: ImportFileOptions): StoreResult {
    const raw_data = readFileSync(filename)
    const hash = hashContent(raw_data)
    return useMediaType(
      media_type,
      raw_data,
      filename,
      this.db.transaction(media_type => {
        const content_id = this.storeContentAndHash({
          raw_data,
          hash,
          media_type,
          inline_raw_data: false,
        })
        this.insert_file.run({ filename, content_id })
        if (tags) this.storeTags(content_id, tags)
        return content_id
      }),
    )
  }

  /** remove files on directory that is already stored in ContentStore */
  removeExistingContent({
    dir,
    recursive,
    verbose,
  }: RemoveExistingContentOptions) {
    const dirStack: string[] = [dir]
    for (;;) {
      const dir = dirStack.pop()
      if (!dir) break
      const files = readdirSync(dir)
      files.forEach(filename => {
        const fullPath = join(dir, filename)
        const stat = statSync(fullPath)
        if (stat.isDirectory() && recursive) {
          dirStack.push(fullPath)
          return
        }
        if (!stat.isFile()) return
        const row = this.select_by_filename.get(fullPath)
        if (!row) return
        if (verbose) console.debug('rm', fullPath)
        unlinkSync(fullPath)
      })
    }
  }

  loadContent(content_id: number): LoadContentResult {
    const row = this.select_content.get(content_id)
    if (!row) {
      throw new Error('content not found')
    }
    return row
  }

  loadFile(content_id: number): LoadFileResult {
    const row = this.select_file.get(content_id)
    if (!row) {
      throw new Error('file not found')
    }
    return row
  }

  loadContentOrFile(content_id: number): LoadContentResult {
    const contentRow = this.select_content.get(content_id)
    if (!contentRow) {
      throw new ErrorWithRemark('content not found', 'not in content table')
    }
    if (contentRow.raw_data) {
      return contentRow
    }
    const filename = this.select_filename.get(content_id)
    if (!filename) {
      throw new ErrorWithRemark('content not found', 'not in file table')
    }
    try {
      const raw_data = readFileSync(filename)
      return {
        media_type: contentRow.media_type,
        raw_data: raw_data,
      }
    } catch (error) {
      throw new ErrorWithFilename('file not found', filename)
    }
  }

  findContentByHash(hash: Buffer): number {
    const row = this.select_hash_id.get(hash)
    if (!row) {
      throw new Error('content not found')
    }
    return row.content_id
  }

  private storeTags(content_id: number, tags: string[]) {
    tags.forEach(tag => this.insert_tag.run({ tag, content_id }))
  }

  private storeContentAndHash(args: {
    raw_data: Buffer
    media_type: string
    hash: Buffer
    inline_raw_data: boolean
  }): number {
    // check if this content already exists
    const row = this.select_hash_id.get(args.hash)
    if (row) return row.content_id

    // store the content
    const content_id = this.insert_content.run({
      raw_data: args.inline_raw_data ? args.raw_data : null,
      mime_type_id: this.getMimeTypeId(args.media_type),
    }).lastInsertRowid as number
    this.db.insert('sha256', { hash: args.hash, content_id })

    return content_id
  }

  private getMimeTypeId(mimeType: string): number {
    const row = this.select_mime_type_id.get(mimeType)
    if (row) return row.id
    return this.db.insert('mime_type', { media_type: mimeType })
  }
}

export class ErrorWithRemark extends Error {
  constructor(message: string, public remark: string) {
    super(message)
  }
}
export class ErrorWithFilename extends Error {
  constructor(message: string, public filename: string) {
    super(message)
  }
}

function useMediaType<T>(
  media_type: string | undefined,
  raw_data: Buffer,
  filename: string | undefined,
  fn: (media_type: string) => T,
): T | Promise<T> {
  if (media_type) {
    return fn(media_type)
  }
  return detectMimeType(raw_data, filename).then(fn)
}

function hashContent(raw_data: Buffer): Buffer {
  const hash = createHash('sha256')
  hash.write(raw_data)
  return hash.digest()
}
