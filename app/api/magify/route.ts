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
    const prompt = `Analyze the uploaded image and detect if there is a visible hand, head, or a central character or object.
– If a hand is present, add a detailed wizard’s wand (not a staff) held naturally.
– If a head is visible, place a tall, pointed wizard hat on it, matching angle and lighting.
– If a face is clearly recognized, also add a long, thick, flowing wizard-style beard, adapted to the image’s perspective and style.
– Always surround the main subject with a subtle but clearly visible magical aura (glow, light particles, soft radiance).

Match all added elements (wand, hat, beard, aura) to the original image:
– If the input is artwork or illustration, replicate its drawing style and texture.
– If the input is a photo or realistic image, make all additions photorealistic and seamlessly blended.

Preserve the original pose, proportions, facial features, and background. Avoid altering the subject’s identity or expression. The goal is magical enhancement, not transformation.`

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
