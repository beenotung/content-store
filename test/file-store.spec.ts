import { DBInstance } from 'better-sqlite3-schema'
import { expect } from 'chai'
import { ContentStore, hashContent } from '../src/core'
import { createDB } from '../src/db'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'

describe('file->store test suit', () => {
  let db_file = 'test.db'
  let db: DBInstance
  let store: ContentStore

  let content_id: number

  before(function () {
    this.timeout(5000)
    if (existsSync(db_file)) {
      unlinkSync(db_file)
    }
    db = createDB(db_file)
    store = new ContentStore(db)
  })

  it('should store content', async () => {
    let raw_data = Buffer.from('hello')
    content_id = await store.storeContent({
      raw_data,
      media_type: 'text/plain',
    })
  }).timeout(5000)

  it('should get back data', () => {
    let { raw_data, media_type } = store.loadContent(content_id)
    expect(media_type).to.equal('text/plain')
    expect(raw_data.toString()).to.equal('hello')
  })

  it('should detect and store image', async () => {
    let filename = require.resolve('mocha')
    let dir = dirname(filename)
    filename = join(dir, 'assets', 'growl', 'ok.png')

    let content_id = await store.importFile({ filename })
    let row = store.loadFile(content_id)
    expect(row.media_type).to.equals('image/png')
    expect(row.filename).to.equals(filename)
  })

  it('should load content in db or file', async () => {
    let raw_data = Buffer.from('in-memory data')
    let mem_content_id = await store.storeContent({ raw_data })

    let filename = 'package.json'
    let file_content_id = await store.importFile({ filename })

    expect(store.loadContentOrFile(mem_content_id).raw_data).deep.equals(
      raw_data,
    )

    expect(store.loadContentOrFile(file_content_id).raw_data).deep.equals(
      readFileSync(filename),
    )
  })

  it('should look up content by hash', async () => {
    let raw_data = Buffer.from('raw data for hash lookup test')
    let hash = hashContent(raw_data)
    expect(hash).not.undefined
    let result = await store.storeContent({ raw_data })
    expect(result).not.undefined
    let id = store.findContentByHash(hash)
    expect(id).to.equals(result)
  })

  it('should compress large textual content', async () => {
    let file = require.resolve('typescript/lib/tsserver')
    let raw_data = readFileSync(file)
    let hash = hashContent(raw_data)
    let result = await store.storeContent({
      raw_data,
      media_type: 'text/typescript',
    })
    expect(result).not.undefined
    let id = store.findContentByHash(hash)
    expect(id).to.equals(result)
    let row = store.db
      .prepare(`select zst_data from content where id = ?`)
      .get(id)
    expect(row).not.undefined
    expect(row.zst_data).to.deep.equals(raw_data)
  })
})
