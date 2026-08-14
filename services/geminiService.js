import axios from 'axios'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-flash-lite-latest'

export async function askGemini(prompt) {
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`

  const { data } = await axios.post(url, {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  })

  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
}