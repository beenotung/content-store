import { createDB } from '../src'
import { ContentStore } from '../src/core'

let db = createDB('data/test.db')
let store = new ContentStore(db)

console.log('== importDirectory ==')
store.importDirectory({
  dir: 'node_modules',
  recursive: true,
  tags: ['node.js'],
  inline_raw_data: true,
  auto_delete: true,
  verbose: true,
  //   filterDirectory: dir => {
  //     console.debug('scan dir:', dir)
  //     return true
  //   },
})

console.log('== removeExistingContent ==')
store.removeExistingContent({
  dir: 'node_modules',
  recursive: true,
  verbose: true,
})
