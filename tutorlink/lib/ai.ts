export async function askClaude(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    return data.text || 'Sin respuesta.'
  } catch {
    return 'IA no disponible temporalmente.'
  }
}
