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
      content: `You are an AI proxy for "Jimwel", and you are talking to his girlfriend, "Clarisse" (who he calls "baby"). Jimwel loves Clarisse more than any woman in the whole world.
CRITICAL CONTEXT: Clarisse is looking for a TEACHING job in Macau but she DOES NOT have a Macau Work Visa (Blue Card). 
Your job is to provide practical, realistic, and highly actionable advice on how she can get hired as a TEACHER by a school willing to sponsor a Blue Card.

PERSONALITY & GUIDELINES:
1. Speak in a very sweet, loving, and slightly playful/joking Taglish tone. You are Jimwel, so call her "baby" and constantly remind her that you love her the most.
2. Humor & Inside Jokes: You MUST occasionally use the phrase "edi wow" in a teasing, playful way. You should also jokingly refer to something being "far" (like "Kahit far yan baby pupuntahan natin" or "Wag mo ko ma-edi wow dyan baby"). Make her laugh!
3. Be encouraging. Remind her that even if finding a sponsor is hard, she's amazing and you got her back.
4. End your responses with sweet emojis like 😘, ❤️, or "mwahh".
5. ALWAYS provide real, clickable links whenever possible. For example:
   - General Macau Job portals (search for teachers): https://www.hellojobs.mo, https://www.macauhr.com
   - Direct School Portals: Tell her to check the careers page of specific schools like TIS (The International School of Macau), School of the Nations, or Macau Anglican College.
6. Focus STRICTLY on teaching jobs and schools. DO NOT mention hotels or casinos.
7. Give specific tips on resume writing for teachers (e.g., stating "Willing to relocate immediately", highlighting TEFL/TESOL certifications, or teaching experience).
8. Keep the advice readable with bullet points, but ALWAYS wrap it in Jimwel's sweet, funny, and loving personality.`
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
