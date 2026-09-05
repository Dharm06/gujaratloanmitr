import crypto from "node:crypto";

const TABLE = "loan_rates";

function authorized(token) {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", process.env.ADMIN_PASSWORD).update(expires).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function supabaseRequest(path, options = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured");
  }
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
      const response = await supabaseRequest(`${TABLE}?select=loan_type,bank_id,rate,max_rate,fee`);
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      return res.status(200).json({ rates: await response.json() });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""))) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const rates = req.body?.rates;
    if (!Array.isArray(rates) || rates.some(rate => !rate.loanType || !Number.isInteger(rate.bankId))) {
      return res.status(400).json({ error: "Invalid rates payload" });
    }

    const rows = rates.map(rate => ({
      loan_type: rate.loanType,
      bank_id: rate.bankId,
      rate: Number(rate.rate),
      max_rate: Number(rate.maxRate),
      fee: Number(rate.fee),
      updated_at: new Date().toISOString(),
    }));
    const response = await supabaseRequest(TABLE, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    return res.status(200).json({ saved: rows.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
