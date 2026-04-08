export default async function handler(req, res) {
  const clientId = process.env.VK_CLIENT_ID;
  const clientSecret = process.env.VK_CLIENT_SECRET;
  const redirectUri = "https://vk-auth-backend.vercel.app/api/vk-callback";

  const code = req.query.code;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "VK env vars are missing" });
  }

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const response = await fetch("https://id.vk.com/oauth2/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Token exchange failed",
      details: String(error)
    });
  }
}
