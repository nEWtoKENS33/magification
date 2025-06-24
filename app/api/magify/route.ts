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
    const prompt = `Analyze the uploaded image and identify if there is a visible hand, a visible head, or a central character or object.

– If a hand is present, add a detailed wizard staff held naturally in the hand.
– If a head is visible, place a tall, pointed wizard hat on top of it, matching the angle and lighting.
– Regardless of content, always surround the main subject with a subtle but clearly visible magical aura (glow, light particles, soft radiance).

Match the style of the additions (staff, hat, aura) to the original image:
– If the input is artwork or illustration, match the drawing style and texture.
– If the input is a photo or realistic image, make all elements photorealistic and properly blended.

Maintain the original pose, proportions, and background as much as possible. Avoid altering the subject’s identity or expression. Focus on enhancement, not transformation.`

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
