import { detectMimeType } from '../src/detect'
import { expect } from 'chai'

const MimeTypes = {
  svg: 'image/svg+xml',
  xml: 'application/xml',
  html: 'text/html',
}

describe('text-based format detection', () => {
  it('should detect svg root node', async () => {
    expect(
      await detectMimeType(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg"><path fill="#00CD9F"/></svg>`,
        ),
      ),
    ).to.equal(MimeTypes.svg)
  })

  it('should detect inline svg', async () => {
    expect(
      await detectMimeType(Buffer.from(`<svg width="100" height="100"></svg>`)),
    ).to.equal(MimeTypes.svg)
  })

  it('should detect svg document', async () => {
    expect(
      await detectMimeType(
        Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="391" height="391" viewBox="-70.5 -70.5 391 391" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
</svg>`),
      ),
    ).to.equal(MimeTypes.svg)
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
    ).to.equal(MimeTypes.xml)
  })

  it('should detect inline html', async () => {
    expect(await detectMimeType(Buffer.from(`<html></html>`))).deep.equal(
      MimeTypes.html,
    )
  })

  it('should detect html document', async () => {
    expect(
      await detectMimeType(Buffer.from(`<!DOCTYPE html><html></html>`)),
    ).to.equal(MimeTypes.html)
  })
})
