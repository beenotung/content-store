import fileType from 'file-type'
import isSvg from 'is-svg'
import mimeType from 'mime-type/with-db'

const HTMLDocPrefix = '<!DOCTYPE HTML'
const HTMLPrefix = '<html'

mimeType.types['ts'] = 'text/typescript'

export function detectMimeType(
  raw_data: Buffer,
  filename: string | undefined,
): Promise<string> {
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
    if (filename) {
      const mimeResult = mimeType.lookup(filename)
      if (typeof mimeResult === 'string') {
        return mimeResult
      }
      if (Array.isArray(mimeResult) && mimeResult.length > 0) {
        return mimeResult[0]
      }
    }
    return 'application/octet-stream'
  })
}
