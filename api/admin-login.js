import crypto from "node:crypto";

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(value).digest("hex");
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "ADMIN_PASSWORD is not configured" });
  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid password" });

  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const value = `${expires}.${sign(String(expires))}`;
  return res.status(200).json({ token: value, expires });
}
