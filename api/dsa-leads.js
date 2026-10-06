import crypto from "node:crypto";

const TABLE = "dsa_call_leads";

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
      if (!authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""))) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      const response = await supabaseRequest(`${TABLE}?select=id,payload,created_at&order=created_at.desc`);
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      const rows = await response.json();
      return res.status(200).json({ leads: rows.map(row => ({ ...row.payload, id: row.id, createdAt: row.created_at })) });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const lead = req.body?.lead;
    if (!lead || typeof lead.name !== "string" || !lead.name.trim() || typeof lead.phone !== "string" || !lead.phone.trim() || typeof lead.city !== "string" || !lead.city.trim()) {
      return res.status(400).json({ error: "Name, mobile number, and city are required" });
    }
    const payload = {
      name: lead.name.trim().slice(0, 120),
      phone: lead.phone.trim().slice(0, 30),
      city: lead.city.trim().slice(0, 120),
      targetId: String(lead.targetId || "").slice(0, 120),
      targetName: String(lead.targetName || "DSA advisor").slice(0, 120),
    };
    const row = { id: crypto.randomUUID(), payload, created_at: new Date().toISOString() };
    const response = await supabaseRequest(TABLE, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    return res.status(201).json({ saved: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
