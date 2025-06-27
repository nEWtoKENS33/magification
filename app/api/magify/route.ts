import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import sharp from 'sharp'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Convierte un Buffer en un objeto File válido para OpenAI
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

    // ⚙️ Crear la máscara basada en el canal alfa (transparencia) de la imagen
    const maskBuffer = await sharp(buffer)
      .ensureAlpha() // Garantiza que tenga canal alfa
      .extractChannel('alpha') // Extrae el canal alfa
      .toColourspace('b-w') // Lo convierte en blanco y negro
      .toBuffer()

    const maskFile = bufferToFile(maskBuffer, 'mask.png')

    // 🎨 Llamada a OpenAI para editar la imagen
    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt: `A cartoon-style character with a unique shape and expressive face, wearing a sweater, is standing on the surface of the Moon. Starry night sky in the background and visible craters on the lunar ground. The character is holding a glowing tablet or object with a symbol on it (such as a crypto logo). Around the character, add futuristic user interface elements like floating charts, stats, or status bars. The mood is calm but powerful, as if showcasing innovation or progress in a sci-fi crypto world.`,
      size: '512x512',
      response_format: 'url',
      n: 1,
    })

    if (!response.data || !response.data[0].url) {
      return NextResponse.json({ error: 'No image returned from OpenAI' }, { status: 500 })
    }

    const imageUrl = response.data[0].url
    console.log('✅ Imagen generada por OpenAI:', imageUrl)

    return NextResponse.json({ resultUrl: imageUrl })
  } catch (err: any) {
    console.error('❌ Error en /api/magify:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
