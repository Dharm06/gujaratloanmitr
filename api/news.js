const FEEDS = [
  { url: "https://www.rbi.org.in/Scripts/BS_PressReleaseRSS.aspx", source: "RBI" },
  { url: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3", source: "PIB" },
];

function tag(xml, name) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? match[1].replace(/<!\\[CDATA\\[|\\]\\]>/g, "").trim() : "";
}

function clean(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  const results = [];

  for (const feed of FEEDS) {
    const response = await fetch(feed.url, { headers: { "User-Agent": "GujaratLoanMitra/1.0" } });
    if (!response.ok) throw new Error(`${feed.source} feed returned ${response.status}`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0, 8);
    items.forEach(([, item], index) => {
      const title = clean(tag(item, "title"));
      const summary = clean(tag(item, "description") || tag(item, "summary") || tag(item, "content"));
      const link = clean(tag(item, "link"));
      if (title) results.push({
        id: `${feed.source}-${index}-${title.slice(0, 20)}`,
        type: /fraud|scam|cyber|warning|alert/i.test(title) ? "fraud" : /scheme|yojana|subsidy|government/i.test(title) ? "govt" : "rbi",
        urgent: /fraud|scam|cyber|warning|alert/i.test(title),
        tag: feed.source,
        tagColor: feed.source === "RBI" ? "#3B82F6" : "#B8860B",
        time: "Latest",
        timeGu: "તાજેતરનું",
        readMin: 2,
        title,
        titleGu: title,
        summary: summary || title,
        summaryGu: summary || title,
        warning: null,
        warningGu: null,
        shareText: `${title}${link ? ` ${link}` : ""}`,
      });
    });
  }

  res.status(200).json({ updatedAt: new Date().toISOString(), items: results.slice(0, 12) });
}
