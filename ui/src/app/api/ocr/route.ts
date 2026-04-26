import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API keys are missing on the server' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Send the image to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/png"
          }
        },
        'Extract all the text you can read from this image. Do not add any extra commentary, greetings, or pleasantries. Strictly return ONLY the raw text exactly as you see it.'
      ]
    });

    const text = response.text || "";
    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Failed to extract text from image:', error.message);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
