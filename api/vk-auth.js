export default async function handler(req, res) {
  const clientId = process.env.VK_CLIENT_ID;
  const redirectUri = "https://vk-auth-backend.vercel.app/api/vk-callback";

  if (!clientId) {
    return res.status(500).json({ error: "VK_CLIENT_ID is missing" });
  }

  const authUrl =
    "https://id.vk.com/auth" +
    `?app_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=offline groups wall messages` +
    `&state=streamvi_auth`;

  return res.redirect(authUrl);
}
