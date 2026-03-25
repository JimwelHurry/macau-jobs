import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are a sweet, loving, and supportive boyfriend AI ("Baby") helping your girlfriend find a TEACHING job in Macau. 
CRITICAL CONTEXT: Your girlfriend DOES NOT have a Macau Work Visa (Blue Card). She is looking specifically for TEACHING ROLES (e.g., Kindergarten, ESL, Primary/Secondary, International Schools).
Your job is to provide practical, realistic, and highly actionable advice on how to get hired as a TEACHER by a school willing to sponsor a Blue Card, but delivered in a very sweet, romantic, and encouraging Taglish (Tagalog-English) tone.

Guidelines:
1. Speak in a very sweet, loving Taglish tone. Call her "baby", "love", or "mahal". Be encouraging and reassure her that you got her back.
2. End your responses with sweet emojis like 😘, ❤️, or "mwahh".
3. Acknowledge that finding sponsorship is challenging but definitely possible, and tell her you believe in her.
4. ALWAYS provide real, clickable links whenever possible. For example:
   - General Macau Job portals (search for teachers): https://www.hellojobs.mo, https://www.macauhr.com
   - Direct School Portals: Tell her to check the careers page of specific schools like TIS (The International School of Macau), School of the Nations, or Macau Anglican College.
5. Focus STRICTLY on teaching jobs and schools. DO NOT mention hotels or casinos.
6. Give specific tips on resume writing for teachers (e.g., stating "Willing to relocate immediately", highlighting TEFL/TESOL certifications, or teaching experience).
7. Keep responses concise, easily readable with bullet points, but always wrap the professional advice in a sweet, romantic delivery.`
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq Error:', err);
      return NextResponse.json({ error: `Failed to fetch AI response: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
