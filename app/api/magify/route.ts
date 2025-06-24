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

    // 🟣 Crear la máscara a partir del canal alfa con sharp
    const maskBuffer = await sharp(buffer)
      .ensureAlpha() // Asegura canal alfa
      .extractChannel('alpha') // Extrae canal alfa
      .toColourspace('b-w') // Convierte a blanco y negro
      .png()
      .toBuffer()

    const maskFile = bufferToFile(maskBuffer, 'mask.png')

    // ✨ Prompt descriptivo mágico
    const prompt = `Analyze the uploaded image.
– If a hand is visible, add a wizard’s wand held naturally, with a glowing aura (green, yellow, red, or orange), radiant and subtly reflecting on nearby areas.
– If a head is detected, add a wizard hat (tall, pointed, aligned with head angle) and a Dumbledore-style beard, adapted to the image style.
– Always surround the main subject (person, creature, or object) with a magical aura—glow, particles, or sparkles—enhancing the mystical feel.
– Keep the original background exactly as it is, without altering, replacing, or blurring it.
– Match additions to image type: photorealistic for photos, illustrative for drawings or art.
Preserve the subject’s pose, proportions, and identity. Enhance only; do not transform.`

    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt,
      size: '512x512',
      response_format: 'url',
      n: 1,
    })

    if (!response.data?.[0]?.url) {
      return NextResponse.json({ error: 'No image returned from OpenAI' }, { status: 500 })
    }

    return NextResponse.json({ resultUrl: response.data[0].url })
  } catch (err: any) {
    console.error('❌ Error en /api/magify:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
