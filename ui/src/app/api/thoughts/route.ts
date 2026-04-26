import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/"/g, ''),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    // Assuming Sheet1 is the default
    const SHEET_NAME = 'Sheet1';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = response.data.values || [];
    
    // Skip header and format
    const thoughts = rows.slice(1).map((row, index) => ({
      id: index,
      date: row[0] || "Unknown Date",
      rawThought: row[1] || "",
      category: row[2] || "Uncategorized",
      aiRewrite: row[3] || null,
      summary: row[4] || null
    })).filter(t => t.rawThought.length > 0)
    // Most recent first
    .reverse();

    return NextResponse.json({ thoughts });
  } catch (error: any) {
    console.error('Failed to parse from sheets:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawThought, category } = body;

    if (!rawThought) {
      return NextResponse.json({ error: 'Thought is required' }, { status: 400 });
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/"/g, ''),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_NAME = 'Sheet1';

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:C`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[dateStr, rawThought, category || ""]]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to append thought:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
