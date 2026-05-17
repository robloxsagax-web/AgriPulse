import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 60

const VALID_KATEGORIE = new Set([
  'plastik_metal', 'papier', 'szklo', 'bio', 'zmieszane',
  'tekstylia', 'elektroodpady', 'pszok', 'kaucja', 'nieznane',
])

const REQUIRED_FIELDS = [
  'kategoria', 'pewnosc', 'nazwa_przedmiotu',
  'jak_przygotowac', 'wyjasnienie', 'uwaga_dodatkowa',
  'potrzebne_doprecyzowanie',
]

const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT ?? '60000', 10)

const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), 'app', 'lib', 'system-prompt.md'),
  'utf-8',
)

function errorResponse(status: number, message: string) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  // 1. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse(400, 'Nieprawidłowe żądanie.')
  }

  const imageField = formData.get('image')
  if (!imageField || !(imageField instanceof Blob)) {
    return errorResponse(400, 'Nie przesłano zdjęcia.')
  }

  // 2. Validate OLLAMA_URL
  const ollamaUrl = process.env.OLLAMA_URL
  if (!ollamaUrl) {
    console.error('[classify] OLLAMA_URL is not set')
    return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
  }

  // 3. Resize image to max 1024px on the long edge
  let base64Image: string
  try {
    const buffer = Buffer.from(await imageField.arrayBuffer())
    const resized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    base64Image = resized.toString('base64')
  } catch (err) {
    console.error('[classify] Image processing failed:', err)
    return errorResponse(422, 'Nie udało się przetworzyć zdjęcia. Sprawdź format pliku.')
  }

  // 4. Call Ollama with a configurable timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let ollamaBody: unknown
  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: 'gemma4:e4b',
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: 'Do którego kosza powinienem to wyrzucić?',
            images: [base64Image],
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error('[classify] Ollama returned HTTP', res.status)
      return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
    }

    ollamaBody = await res.json()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[classify] Ollama request timed out after', TIMEOUT_MS, 'ms')
      return errorResponse(504, 'Analizowanie zdjęcia trwało zbyt długo. Spróbuj ponownie.')
    }
    console.error('[classify] Ollama unreachable:', err)
    return errorResponse(503, 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.')
  } finally {
    clearTimeout(timeoutId)
  }

  // 5. Extract content from Ollama's response envelope
  const rawContent = (ollamaBody as { message?: { content?: unknown } })?.message?.content

  // 6. Parse the JSON that Gemma produced
  let result: Record<string, unknown>
  try {
    if (typeof rawContent === 'string') {
      result = JSON.parse(rawContent)
    } else if (typeof rawContent === 'object' && rawContent !== null) {
      result = rawContent as Record<string, unknown>
    } else {
      throw new Error(`Unexpected content type: ${typeof rawContent}`)
    }
  } catch (err) {
    console.error('[classify] Failed to parse Gemma JSON:', err, '\nRaw:', rawContent)
    return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
  }

  // 7. Validate required fields are present
  for (const field of REQUIRED_FIELDS) {
    if (!(field in result)) {
      console.error('[classify] Missing required field:', field, result)
      return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
    }
  }

  // 8. Validate kategoria is one of the known values
  if (!VALID_KATEGORIE.has(result.kategoria as string)) {
    console.error('[classify] Unknown kategoria value:', result.kategoria)
    return errorResponse(422, 'Nie udało się przeanalizować zdjęcia. Spróbuj zrobić wyraźniejsze zdjęcie.')
  }

  return Response.json(result)
}
