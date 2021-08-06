import { ContentStore } from '../src/core'
import { createDB } from '../src/db'

describe('file->store test suit', () => {
  let db = createDB()
  let store = new ContentStore(db)

  it('should store content', () => {
    let raw_data = Buffer.from('hello')
    store.storeContent({ raw_data })
  })

  it('should get back data', () => {
    // TODO
  })
})
