import crypto from "node:crypto";

const TABLE = "dsa_profiles";

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
      const response = await supabaseRequest(`${TABLE}?select=id,payload,updated_at&order=updated_at.desc`);
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      const rows = await response.json();
      const isAdmin = authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""));
      return res.status(200).json({ profiles: rows.map(row => ({ ...row.payload, id: row.id })).filter(profile => isAdmin || profile.published !== false) });
    }
    if (req.method === "DELETE") {
      if (!authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""))) {
        return res.status(401).json({ error: "Admin authentication required" });
      }
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ error: "DSA profile id is required" });
      const response = await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
      return res.status(200).json({ removed: id });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!authorized(req.headers.authorization?.replace(/^Bearer\s+/i, ""))) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    const profiles = req.body?.profiles;
    if (!Array.isArray(profiles) || profiles.some(profile => !profile || typeof profile.id !== "string" || !profile.id.trim() || typeof profile.name !== "string" || !profile.name.trim())) {
      return res.status(400).json({ error: "Each DSA profile requires an id and name" });
    }
    const rows = profiles.map(profile => ({
      id: profile.id.trim(),
      payload: {
        id: profile.id.trim(),
        name: profile.name.trim(),
        photo: String(profile.photo || "").trim(),
        workspacePhoto1: String(profile.workspacePhoto1 || "").trim(),
        workspacePhoto2: String(profile.workspacePhoto2 || "").trim(),
        designation: String(profile.designation || "").trim(),
        city: String(profile.city || "").trim(),
        phone: String(profile.phone || "").trim(),
        email: String(profile.email || "").trim(),
        experience: String(profile.experience || "").trim(),
        description: String(profile.description || "").trim(),
        specializations: String(profile.specializations || "").trim(),
        languages: String(profile.languages || "").trim(),
        published: profile.published !== false,
      },
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
