import { createDB } from '../src'
import { ContentStore } from '../src/core'

let db = createDB('data/test.db')
let store = new ContentStore(db)

store.importDirectory({
  dir: 'node_modules',
  recursive: true,
  tags: ['node.js'],
  //   filterDirectory: dir => {
  //     console.debug('scan dir:', dir)
  //     return true
  //   },
})
