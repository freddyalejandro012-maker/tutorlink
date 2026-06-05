import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'No prompt' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Eres el asistente inteligente de TutorLink, una plataforma de tutorías universitarias en Bolivia (La Paz). 
Ayudas a estudiantes a encontrar profesores y a profesores a conseguir alumnos.
Responde siempre en español, de forma concisa y útil (máximo 3-4 oraciones).
No uses markdown, solo texto plano y natural.`,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || 'Sin respuesta.'
    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ text: 'Error al contactar la IA.' })
  }
}
