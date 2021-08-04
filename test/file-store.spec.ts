import { storeContent } from '../src/core'

describe('file->store test suit', () => {
  it('should run', () => {
    storeContent(Buffer.from('hello'))
  })
})
