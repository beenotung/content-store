import { detectMimeType } from '../src/detect'
import { expect } from 'chai'

const svgResult = {
  ext: 'svg',
  mime: 'image/svg+xml',
}

describe('text-based format detection', () => {
  it('should detect svg root node', async () => {
    expect(
      await detectMimeType(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>`,
        ),
      ),
    ).deep.equal(svgResult)
  })

  it('should detect inline svg', async () => {
    expect(
      await detectMimeType(Buffer.from(`<svg width="100" height="100"></svg>`)),
    ).deep.equal(svgResult)
  })

  it('should detect svg document', async () => {
    expect(
      await detectMimeType(
        Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="391" height="391" viewBox="-70.5 -70.5 391 391" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
</svg>`),
      ),
    ).deep.equal(svgResult)
  })

  it('should detect svg data', async () => {
    expect(
      await detectMimeType(
        Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
  <note>
       <to>Tove</to>
       <from>Jani</from>
       <heading>Reminder</heading>
       <body>Don't forget me this weekend!</body>
   </note>`),
      ),
    ).deep.equal({ ext: 'xml', mime: 'application/xml' })
  })

  it('should detect inline html', async () => {
    expect(await detectMimeType(Buffer.from(`<html></html>`))).deep.equal({
      ext: 'html',
      mime: 'text/html',
    })
  })

  it('should detect html document', async () => {
    expect(
      await detectMimeType(Buffer.from(`<!DOCTYPE html><html></html>`)),
    ).deep.equal({
      ext: 'html',
      mime: 'text/html',
    })
  })
})
