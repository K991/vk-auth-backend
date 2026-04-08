import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// Лучше хранить в Render Environment
const VK_CLIENT_ID = process.env.VK_CLIENT_ID || "54520140";
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || "d5ff824ed5ff824ed5ff824eaed6c06b02dd5ffd5ff824ebc29cecd58fad7a76bc11056";
const REDIRECT_URI =
  process.env.VK_REDIRECT_URI || "https://vk-auth-backend-pfj7.onrender.com/vk/callback";
const VK_API_VERSION = "5.199";

const sessions = new Map();

function vkAuthorizeUrl(sessionId) {
  const params = new URLSearchParams({
    client_id: VK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "offline",
    display: "page",
    v: VK_API_VERSION,
    state: sessionId
  });

  return `https://oauth.vk.com/authorize?${params.toString()}`;
}

function vkAccessTokenUrl(code) {
  const params = new URLSearchParams({
    client_id: VK_CLIENT_ID,
    client_secret: VK_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code: String(code)
  });

  return `https://oauth.vk.com/access_token?${params.toString()}`;
}

app.get("/", (_req, res) => {
  res.send("vk-auth-backend is running");
});

app.get("/vk/auth/start", (req, res) => {
  const { type = "user", groupId = "" } = req.query;
  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    status: "pending",
    type: String(type),
    groupId: String(groupId),
    createdAt: Date.now()
  });

  const authUrl = vkAuthorizeUrl(sessionId);

  res.json({
    sessionId,
    authUrl
  });
});

app.get("/vk/callback", async (req, res) => {
  const { code, error, error_description, state } = req.query;

  if (!state || !sessions.has(String(state))) {
    return res.status(400).send("Unknown or missing session state");
  }

  const sessionId = String(state);

  if (error) {
    sessions.set(sessionId, {
      status: "error",
      error: `${error}: ${error_description || "VK auth error"}`
    });
    return res.status(400).send(`VK auth error: ${error_description || error}`);
  }

  if (!code) {
    sessions.set(sessionId, {
      status: "error",
      error: "Missing code in callback"
    });
    return res.status(400).send("Missing code");
  }

  try {
    const response = await fetch(vkAccessTokenUrl(code));
    const data = await response.json();

    if (!response.ok || data.error) {
      sessions.set(sessionId, {
        status: "error",
        error: data.error_description || data.error || "VK token exchange failed"
      });
      return res.status(400).send(`Token exchange failed: ${JSON.stringify(data)}`);
    }

    sessions.set(sessionId, {
      status: "done",
      accessToken: data.access_token || "",
      userId: data.user_id || null,
      email: data.email || null
    });

    return res.send("OK, можно закрыть окно и вернуться в приложение.");
  } catch (e) {
    sessions.set(sessionId, {
      status: "error",
      error: e instanceof Error ? e.message : "Unknown server error"
    });
    return res.status(500).send("Ошибка авторизации");
  }
});

app.get("/vk/auth/status", (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId || !sessions.has(String(sessionId))) {
    return res.json({ status: "error", error: "Session not found" });
  }

  return res.json(sessions.get(String(sessionId)));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
