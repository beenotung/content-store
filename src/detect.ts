import fileType from 'file-type'
import isSvg from 'is-svg'

const HTMLDocPrefix = '<!DOCTYPE HTML'
const HTMLPrefix = '<html'

export function detectMimeType(
  raw_data: Buffer,
): Promise<fileType.FileTypeResult> {
  return fileType.fromBuffer(raw_data).then(result => {
    if (result) {
      if (result.ext === 'xml' && isSvg(raw_data)) {
        return { ext: 'svg', mime: 'image/svg+xml' }
      }
      return result
    }
    if (isSvg(raw_data)) {
      return { ext: 'svg', mime: 'image/svg+xml' }
    }
    if (
      (raw_data.length >= HTMLDocPrefix.length &&
        raw_data.slice(0, HTMLDocPrefix.length).toString()
.toUpperCase() ===
          HTMLDocPrefix) ||
      (raw_data.length >= HTMLPrefix.length &&
        raw_data.slice(0, HTMLPrefix.length).toString()
.toLowerCase() ===
          HTMLPrefix)
    ) {
      return { ext: 'html', mime: 'text/html' }
    }
    return {
      ext: '' as any,
      mime: 'application/octet-stream' as any,
    }
  })
}
