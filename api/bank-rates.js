const CONNECTORS = [
  {
    bank: "State Bank of India",
    slug: "sbi",
    url: "https://sbi.co.in/web/personal-banking/loans/home-loan",
    patterns: [/(?:interest\s+rate|rate\s+of\s+interest|roi)[^%]{0,100}?(\d{1,2}(?:\.\d{1,2})?)\s*%/gi],
  },
  {
    bank: "HDFC Bank",
    slug: "hdfc",
    url: "https://www.hdfc.com/loans/home-loan",
    patterns: [/(?:interest\s+rate|rate\s+of\s+interest|roi)[^%]{0,100}?(\d{1,2}(?:\.\d{1,2})?)\s*%/gi],
  },
  {
    bank: "ICICI Bank",
    slug: "icici",
    url: "https://www.icicibank.com/personal-banking/loans/home-loan",
    patterns: [/(?:interest\s+rate|rate\s+of\s+interest|roi)[^%]{0,100}?(\d{1,2}(?:\.\d{1,2})?)\s*%/gi],
  },
  {
    bank: "Bank of Baroda",
    slug: "bob",
    url: "https://www.bankofbaroda.in/personal-banking/loans/home-loan",
    patterns: [/(?:interest\s+rate|rate\s+of\s+interest|roi)[^%]{0,100}?(\d{1,2}(?:\.\d{1,2})?)\s*%/gi],
  },
];

function extractRate(html, patterns) {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ");
  const rates = patterns.flatMap(pattern => [...text.matchAll(pattern)].map(match => Number(match[1])))
    .filter(rate => rate >= 3 && rate <= 30);
  return rates.length ? Math.min(...rates) : null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");

  const results = await Promise.all(CONNECTORS.map(async connector => {
    try {
      const response = await fetch(connector.url, {
        headers: { "User-Agent": "GujaratLoanMitra/1.0 (rate information)" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rate = extractRate(await response.text(), connector.patterns);
      if (rate === null) throw new Error("No public rate found");
      return { bank: connector.bank, slug: connector.slug, type: "home", rate, sourceUrl: connector.url, status: "updated" };
    } catch (error) {
      return { bank: connector.bank, slug: connector.slug, type: "home", sourceUrl: connector.url, status: "unavailable", error: error.message };
    }
  }));

  res.status(200).json({
    updatedAt: new Date().toISOString(),
    connectors: results,
    note: "Rates are indicative. Verify eligibility and final pricing with the bank.",
  });
}
