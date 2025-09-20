import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Gemini API Key from .env

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    // Load Gemini model (replace with latest version if available)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Send prompt
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const reply = result.response.text();
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
}
