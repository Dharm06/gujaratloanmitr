import crypto from "node:crypto";

const TABLE = "custom_nbfcs";

function authorized(token) {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", process.env.ADMIN_PASSWORD).update(expires).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function supabaseRequest(path, options = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase is not configured");
  return fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const response = await supabaseRequest(`${TABLE}?select=id,payload,updated_at&order=updated_at.desc`);
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      const rows = await response.json();
      return res.status(200).json({ nbfcs: rows.map(row => ({ ...row.payload, id: row.id })).filter(item => item.published !== false) });
    }
    if (!authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""))) return res.status(401).json({ error: "Admin authentication required" });
    if (req.method === "DELETE") {
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ error: "NBFC id is required" });
      const response = await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      return res.status(200).json({ removed: id });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const item = req.body?.nbfc;
    if (!item || typeof item.name !== "string" || !item.name.trim() || typeof item.loanType !== "string" || !item.loanType.trim()) {
      return res.status(400).json({ error: "NBFC name and loan category are required" });
    }
    const id = item.id?.trim() || `custom-nbfc-${Date.now()}`;
    const payload = {
      id, name: item.name.trim(), short: String(item.short || item.name).trim(), slug: null, type: "nbfc",
      rate: Number(item.rate) || 0, maxRate: Number(item.maxRate) || Number(item.rate) || 0, fee: Number(item.fee) || 0,
      approval: Number(item.approval) || 0, maxLoan: Number(item.maxLoan) || 0, tenure: String(item.tenure || "").trim(),
      tag: String(item.tag || "Admin listed NBFC").trim(), tagColor: "#8B5CF6", loanType: item.loanType.trim(), published: item.published !== false,
      searchTerms: [item.name, item.short, item.city].filter(Boolean).join(" "),
    };
    const response = await supabaseRequest(TABLE, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id, payload, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    return res.status(200).json({ nbfc: payload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
