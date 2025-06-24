import { Blob } from 'buffer'

export function bufferToFile(buffer: Buffer, filename: string): any {
  const blob = new Blob([buffer], { type: 'image/png' })
  return {
    name: filename,
    type: 'image/png',
    size: buffer.length,
    stream: () => blob.stream(),
  }
}
