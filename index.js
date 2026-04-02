const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("VK backend OK");
});

app.post("/vk/exchange", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const clientId = process.env.VK_CLIENT_ID;
  const clientSecret = process.env.VK_CLIENT_SECRET;
  const redirectUri = process.env.VK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({
      error: "Missing VK env vars"
    });
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    });

    const vkResponse = await fetch(`https://oauth.vk.com/access_token?${params.toString()}`, {
      method: "GET"
    });

    const data = await vkResponse.json();

    if (data.error) {
      return res.status(400).json({
        error: data.error,
        error_description: data.error_description || data.error_msg || "VK exchange failed",
        raw: data
      });
    }

    return res.json({
      access_token: data.access_token,
      user_id: data.user_id,
      expires_in: data.expires_in ?? 0,
      email: data.email ?? null
    });
  } catch (err) {
    return res.status(500).json({
      error: "Exchange failed",
      details: err.message
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});