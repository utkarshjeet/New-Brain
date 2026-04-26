import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';

export async function POST() {
  const SHEET_NAME = 'Sheet1';
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/"/g, ''),
      scopes: SCOPES
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return NextResponse.json({ message: 'No data to process', count: 0 });

    const updates = [];
    
      // Header is row 0. We skip it.
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let date = row[0] || "";
      const rawThought = row[1];
      const category = row[2] || "";
      const aiRewrite = row[3] || "";
      const summary = row[4] || "";

      if (rawThought && rawThought.trim() !== "" && aiRewrite.trim() === "") {
        
        // Handle Auto-Date if missing
        if (date.trim() === "") {
          const now = new Date();
          date = now.toISOString().split("T")[0]; // YYYY-MM-DD
        }

        const existingCategory = category.trim();
        let categoryInstruction = "";
        
        if (existingCategory !== "") {
            categoryInstruction = `The user has already categorized this thought as: "${existingCategory}". Use exactly "${existingCategory}" for the category.`;
        } else {
            categoryInstruction = `Suggest the most suitable category for this thought based on its main theme.
Possible category examples:
Productivity, Discipline, Focus, Business, Money, Relationships, Social Skills, Mindset, Self Improvement, Health, Gym, Learning, Career, Emotions, Decision Making, Observation, Life Lesson, Leadership, Communication, Habits, Strategy.
Make the category specific, not generic.`;
        }

        const promptText = `
You are my Personal Clarity AI.

Your job is to read my raw journal/thought entry and deeply understand what I am actually trying to say, even if my writing is messy, emotional, unclear, repetitive, or poorly structured.

Do NOT change the original meaning.
Do NOT add assumptions, opinions, or new ideas that I did not mention.
Your goal is clarity, precision, and faithful interpretation.

Before rewriting, first analyze the deeper meaning behind the text.
Sometimes the raw entry may be confusing, poorly written, or longer than necessary because the writer is thinking while writing. Your responsibility is to identify the real thought behind the words.

Focus on:
* What is the actual lesson?
* What realization is the writer having?
* What behavioral pattern is being observed?
* What practical insight should be remembered later?

Then rewrite it in a way that future reading becomes fast, clear, and useful for self-improvement and revision.

Important:
This is not creative writing.
This is precision thinking.
Treat every entry like an observation that must be converted into usable knowledge.

Your final output should feel like:
Raw confusion -> Clear wisdom

Never make it sound robotic.
Make it sound intelligent, natural, and sharp.
The rewritten text should feel like something a thoughtful, disciplined person would write after properly understanding the situation.

You must do 3 things:
1. Rewrite the thought clearly in professional, easy-to-understand language while preserving the exact meaning and emotional intent. Keep the rewrite concise but complete, remove unnecessary repetition, and improve structure.
2. Generate a very short summary (1-2 lines maximum) that captures the core insight or lesson from the entry. Make it sharp and memorable.
3. ${categoryInstruction}

Raw Thought: "${rawThought}"

Return a STRICT JSON object exactly containing these three keys:
- "category": the category name.
- "aiRewrite": the clear rewritten version.
- "summary": the short summary.
`;

        try {
          const completion = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
            config: {
              responseMimeType: "application/json",
            }
          });

          const jsonContent = completion.text || "{}";
          const parsed = JSON.parse(jsonContent);
          
          const finalCategory = existingCategory !== "" ? existingCategory : parsed.category;

          updates.push({
            range: `${SHEET_NAME}!A${i + 1}:E${i + 1}`,
            values: [[date, rawThought, finalCategory, parsed.aiRewrite, parsed.summary]],
          });
        } catch(apiErr) {
          console.error(`Failed to generate or parse AI response for row ${i + 1}:`, apiErr);
        }
      }
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
      return NextResponse.json({ message: 'Success', count: updates.length });
    } else {
      return NextResponse.json({ message: 'Nothing to process', count: 0 });
    }
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
