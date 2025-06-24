import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Forzar uso de runtime Node.js (necesario para librerías como 'canvas' o 'sharp')
export const config = {
  runtime: 'nodejs',
}

// Utilidad para convertir Buffer a File
function bufferToFile(buffer: Buffer, name: string, type: string = 'image/png'): File {
  return new File([buffer], name, { type })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const imageFile = bufferToFile(buffer, 'image.png')

    // Crear una máscara blanca del mismo tamaño
    const whiteCanvas = new OffscreenCanvas(512, 512)
    const ctx = whiteCanvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 512, 512)

    const maskBlob = await whiteCanvas.convertToBlob()
    const maskArrayBuffer = await maskBlob.arrayBuffer()
    const maskBuffer = Buffer.from(maskArrayBuffer)
    const maskFile = bufferToFile(maskBuffer, 'mask.png')

    // Llamar a OpenAI para editar la imagen
    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt:
        'A wizardly transformation of the subject, wearing a magical robe, enchanted hat, and holding a glowing wand, all in front of a mystical purple background. Fantasy style.',
      size: '512x512',
      response_format: 'url',
      n: 1,
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from OpenAI' }, { status: 500 })
    }

    return NextResponse.json({ resultUrl: imageUrl })
  } catch (err: any) {
    console.error('❌ Error in /api/magify:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
