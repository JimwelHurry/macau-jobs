import { NextResponse } from 'next/server';

const SERPER_API_URL = 'https://google.serper.dev/search';

// ULTIMATE BROAD QUERIES FOR MACAU SCHOOLS
const QUERIES = [
  'Macau international school teacher jobs',
  'Macau English teacher vacancies',
  'Macau kindergarten teacher hiring',
  'site:edu.mo teacher employment',
  'site:edu.mo teacher vacancies',
  'Macau ESL teacher jobs',
  'Macau private school teacher recruitment',
  'Macau primary school teacher jobs',
  'Macau secondary school teacher vacancies',
  'Macau music teacher jobs',
  'Macau art teacher hiring',
  'Macau special education teacher jobs',
  'Macau physical education teacher vacancies',
  'site:hellojobs.mo teacher',
  'site:macauhr.com teacher'
];

export async function GET() {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'SERPER_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  try {
    const allResults: any[] = [];
    const seenLinks = new Set();

    // Fetch all queries concurrently for faster response
    const fetchPromises = QUERIES.map(async (query) => {
      try {
        const response = await fetch(SERPER_API_URL, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            gl: 'mo', // Enforce Google Macau (gl: geolocation)
            num: 30, // Fetch up to 30 results per query
            tbs: 'qdr:m', // Only fetch jobs from the past month ("bagong upload")
          }),
        });

        if (!response.ok) {
          console.error(`Serper API error for query "${query}": ${response.statusText}`);
          return null;
        }

        return { query, data: await response.json() };
      } catch (err) {
        console.error(`Error fetching query "${query}":`, err);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (!result || !result.data || !result.data.organic) continue;

      for (const item of result.data.organic) {
        if (!item.link || seenLinks.has(item.link)) continue;

        const snippetText = item.snippet || '';
        const titleText = item.title || '';
        const combinedText = `${titleText} ${snippetText}`.toLowerCase();
        const lowerLink = item.link.toLowerCase();

        // Very basic exclusion for completely irrelevant countries
        const isIrrelevantCountry = ['hong kong', 'taiwan', 'singapore', 'japan'].some(loc => 
          combinedText.includes(loc) && !combinedText.includes('macau') && !combinedText.includes('macao') && !lowerLink.includes('.mo')
        );

        if (isIrrelevantCountry) continue;

        // Basic exclusion for obviously wrong jobs
        const isBannedJob = ['driver', 'maid', 'waiter', 'casino dealer'].some(job => combinedText.includes(job));
        if (isBannedJob) continue;

        seenLinks.add(item.link);

        let source = 'Unknown';
        try {
          const urlObj = new URL(item.link);
          source = urlObj.hostname.replace(/^www\./, '');
        } catch {
          // Ignore invalid URLs
        }

        // Basic fallback heuristic
        const hasStatusClue = /sponsor|provided|available|overseas|expatriate|non-resident|blue card/i.test(combinedText);
        const isActivelyHiring = /urgent|upcoming|august|september|immediate|now hiring|apply now/i.test(combinedText);

        const emailMatch = combinedText.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i);
        const email = emailMatch ? emailMatch[0] : null;

        allResults.push({
          title: item.title,
          link: item.link,
          source: source,
          snippet: snippetText,
          hasStatusClue,
          isActivelyHiring,
          email,
          query: result.query,
          date: item.date || 'Recent',
          aiSummary: null, // Will be populated by Groq
          matchScore: 0,
          actionableAdvice: null
        });
      }
    }

    // Sort to prioritize edu.mo and basic matches before sending to Groq
    allResults.sort((a, b) => {
      const aIsEdu = a.link.includes('.edu.mo') || a.link.includes('tis.edu.mo') ? 1 : 0;
      const bIsEdu = b.link.includes('.edu.mo') || b.link.includes('tis.edu.mo') ? 1 : 0;
      
      if (aIsEdu !== bIsEdu) return bIsEdu - aIsEdu;
      if (a.hasStatusClue && !b.hasStatusClue) return -1;
      if (!a.hasStatusClue && b.hasStatusClue) return 1;
      return 0;
    });

    // Take top 40 for Groq Analysis to stay within reasonable token limits
    const topJobs = allResults.slice(0, 40);
    const groqApiKey = process.env.GROQ_API_KEY;

    if (groqApiKey && topJobs.length > 0) {
      try {
        const prompt = `
You are an expert career consultant in Macau helping a foreign applicant who DOES NOT have a work visa (Blue Card).
Analyze these job snippets and determine for each:
1. "offersSponsorship" (boolean): True if the job explicitly mentions "sponsor", "blue card available", "quota", "overseas", "non-resident", or implies they can hire foreigners without an existing visa.
2. "isRecent" (boolean): True if the job is actively hiring, urgent, or newly uploaded based on the date and snippet.
3. "matchScore" (number 0-100): How likely is this employer to sponsor a visa and hire a foreigner based on the snippet? Score higher for explicit mentions of quota/sponsorship.
4. "aiSummary" (string): A short, professional 1-sentence English summary of why this job fits someone needing a visa.
5. "actionableAdvice" (string): 1 short sentence on the best way to approach this specific job (e.g., "Email directly highlighting your willingness to relocate", "Check their career portal for non-resident roles").

Respond strictly with a JSON object containing a "results" array. The array must contain objects with "id" (matching the input id), "offersSponsorship", "isRecent", "matchScore", "aiSummary", and "actionableAdvice".

Jobs to analyze:
${JSON.stringify(topJobs.map((j, i) => ({ id: i, title: j.title, snippet: j.snippet, date: j.date })))}
        `;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You must return valid JSON matching the exact schema requested. Do not include markdown blocks like \`\`\`json' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices[0].message.content;
          
          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch (e) {
             // In case Groq returns markdown wrapped json despite instructions
             const cleanContent = content.replace(/^```json/m, '').replace(/```$/m, '').trim();
             parsed = JSON.parse(cleanContent);
          }
          
          if (parsed.results && Array.isArray(parsed.results)) {
            parsed.results.forEach((res: any) => {
              const job = topJobs[res.id];
              if (job) {
                // Let AI override basic heuristics
                job.hasStatusClue = res.offersSponsorship;
                job.isActivelyHiring = res.isRecent;
                job.aiSummary = res.aiSummary;
                job.matchScore = res.matchScore || 0;
                job.actionableAdvice = res.actionableAdvice;
              }
            });
          }
        } else {
          console.error('Groq API Error:', await groqRes.text());
        }
      } catch (err) {
        console.error('Groq Analysis Failed:', err);
      }
    }

    // Final sorting:
    // 1. Jobs that offer sponsorship AND are recent
    // 2. Jobs that offer sponsorship
    // 3. Jobs that are recent
    topJobs.sort((a, b) => {
      const aScore = (a.hasStatusClue ? 2 : 0) + (a.isActivelyHiring ? 1 : 0);
      const bScore = (b.hasStatusClue ? 2 : 0) + (b.isActivelyHiring ? 1 : 0);
      return bScore - aScore;
    });

    return NextResponse.json({ jobs: topJobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job data.' },
      { status: 500 }
    );
  }
}
