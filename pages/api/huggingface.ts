import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, prompt } = req.body;

    // ✅ NEW: Updated to use the new HuggingFace router endpoint
    const response = await fetch(
      `https://router.huggingface.co/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          model: model, // e.g., "meta-llama/Llama-3.3-70B-Instruct"
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 8192,
          temperature: 0.7,
          top_p: 0.95,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace error:', errorText);
      return res.status(response.status).json({ 
        error: `HuggingFace API error: ${errorText}` 
      });
    }

    const data = await response.json();
    
    // ✅ NEW: Handle OpenAI-compatible response format
    const text = data.choices?.[0]?.message?.content || '';
    
    return res.status(200).json({ generated_text: text });
  } catch (error: any) {
    console.error('HuggingFace API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
