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
      prompt: `A mystical frog wizard wearing a traditional green robe with wide sleeves, sitting cross-legged and holding a glowing wooden wand. It has a tall, pointed wizard hat adorned with subtle arcane symbols. The background should be a magical purple aura with swirling light particles and soft fantasy glow. Keep the character's pose and proportions, enhance with magical lighting and spell effects.
`,
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
