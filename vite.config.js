import crypto from "node:crypto";
import { defineConfig, loadEnv } from "vite";

function signToken(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function isValidToken(token, adminPassword) {
  if (!token || !adminPassword) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = signToken(expires, adminPassword);
  if (signature.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function adminLoginMiddleware(adminPassword) {
  return (req, res, next) => {
    if (req.url !== "/api/admin-login") {
      next();
      return;
    }

    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    let body = "";
    req.setEncoding("utf8");
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      let password;
      try {
        password = JSON.parse(body).password;
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Invalid request body" }));
        return;
      }

      if (!adminPassword) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "ADMIN_PASSWORD is not configured" }));
        return;
      }

      if (typeof password !== "string" || password !== adminPassword) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Invalid password" }));
        return;
      }

      const expires = Date.now() + 8 * 60 * 60 * 1000;
      const token = `${expires}.${signToken(String(expires), adminPassword)}`;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ token, expires }));
    });
  };
}

async function supabaseRatesMiddleware(req, res, env) {
  if (!req.url.startsWith("/api/rates")) return false;

  const supabaseUrl = env.SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Supabase is not configured" }));
    return true;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (req.method === "GET") {
    const response = await fetch(`${supabaseUrl}/rest/v1/loan_rates?select=loan_type,bank_id,rate,max_rate,fee`, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
    });
    const data = await response.json().catch(() => []);
    res.statusCode = response.ok ? 200 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ rates: Array.isArray(data) ? data : [] }));
    return true;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return true;
  }

  if (!isValidToken(token, env.ADMIN_PASSWORD)) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Admin authentication required" }));
    return true;
  }

  let body = "";
  req.setEncoding("utf8");
  req.on("data", chunk => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const rates = Array.isArray(payload.rates) ? payload.rates : [];
      const rows = rates.map(rate => ({
        loan_type: rate.loanType,
        bank_id: Number(rate.bankId),
        rate: Number(rate.rate),
        max_rate: Number(rate.maxRate),
        fee: Number(rate.fee),
        updated_at: new Date().toISOString(),
      }));

      const response = await fetch(`${supabaseUrl}/rest/v1/loan_rates`, {
        method: "POST",
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(rows),
      });

      const text = await response.text();
      res.statusCode = response.ok ? 200 : 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response.ok ? { saved: rows.length } : { error: text || "Failed to save rates" }));
    } catch (error) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid rates payload" }));
    }
  });

  return true;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [{
      name: "local-admin-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/api/admin-login") {
            adminLoginMiddleware(env.ADMIN_PASSWORD)(req, res, next);
            return;
          }
          if (req.url.startsWith("/api/rates")) {
            supabaseRatesMiddleware(req, res, env).then((handled) => {
              if (!handled) next();
            });
            return;
          }
          next();
        });
      },
    }],
  };
});
