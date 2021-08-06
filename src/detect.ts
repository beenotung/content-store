import fileType from 'file-type'
import isSvg from 'is-svg'

const HTMLDocPrefix = '<!DOCTYPE HTML'
const HTMLPrefix = '<html'

export function detectMimeType(raw_data: Buffer): Promise<string> {
  return fileType.fromBuffer(raw_data).then(result => {
    if (result) {
      if (result.ext === 'xml' && isSvg(raw_data)) {
        return 'image/svg+xml'
      }
      return result.mime
    }
    if (isSvg(raw_data)) {
      return 'image/svg+xml'
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
      return 'text/html'
    }
    return 'application/octet-stream'
  })
}
