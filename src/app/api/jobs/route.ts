import { NextResponse } from 'next/server';

const SERPER_API_URL = 'https://google.serper.dev/search';

// ULTIMATE BROAD QUERIES FOR MACAU SCHOOLS
// We are removing all complex boolean logic that might be breaking Google Search
const QUERIES = [
  'Macau international school teacher jobs',
  'Macau English teacher vacancies',
  'Macau kindergarten teacher hiring',
  'site:edu.mo teacher employment',
  'site:edu.mo teacher vacancies'
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
    const allResults = [];
    const seenLinks = new Set();

    // Use Promise.all to fetch all queries concurrently for faster response
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

        // Very basic exclusion for completely irrelevant countries, but keeping it loose
        const isIrrelevantCountry = ['hong kong', 'taiwan', 'singapore', 'japan'].some(loc => 
          combinedText.includes(loc) && !combinedText.includes('macau') && !combinedText.includes('macao') && !lowerLink.includes('.mo')
        );

        if (isIrrelevantCountry) {
            continue;
        }

        // Basic exclusion for obviously wrong jobs
        const isBannedJob = ['driver', 'maid', 'waiter', 'casino dealer'].some(job => combinedText.includes(job));
        if (isBannedJob) {
            continue;
        }

        seenLinks.add(item.link);

        // Extract source from link (domain)
        let source = 'Unknown';
        try {
          const urlObj = new URL(item.link);
          source = urlObj.hostname.replace(/^www\./, '');
        } catch {
          // Ignore invalid URLs
        }

        // Check for 'Blue Card', 'Quota', 'Visa', 'Sponsorship' in the snippet
        const hasStatusClue = /sponsor|provided|available|overseas|expatriate|non-resident|blue card/i.test(combinedText);
        
        // Check if actively hiring for upcoming year/urgent (Bonus Highlight)
        const isActivelyHiring = /urgent|upcoming|august|september|immediate|now hiring|apply now/i.test(combinedText);

        // Extract email if available in the snippet
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
        });
      }
    }

    // Sort results: 
    // 1. .edu.mo domains first (highest quality)
    // 2. Actively Hiring second
    // 3. Status clues third
    allResults.sort((a, b) => {
        const aIsEdu = a.link.includes('.edu.mo') || a.link.includes('tis.edu.mo') ? 1 : 0;
        const bIsEdu = b.link.includes('.edu.mo') || b.link.includes('tis.edu.mo') ? 1 : 0;
        
        if (aIsEdu !== bIsEdu) return bIsEdu - aIsEdu;

        if (a.isActivelyHiring && !b.isActivelyHiring) return -1;
        if (!a.isActivelyHiring && b.isActivelyHiring) return 1;
        
        if (a.hasStatusClue !== b.hasStatusClue) return b.hasStatusClue ? 1 : -1;
        return 0;
    });

    return NextResponse.json({ jobs: allResults });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job data.' },
      { status: 500 }
    );
  }
}
