import express from "express";
import fetch from "node-fetch";

const app = express();

const CLIENT_ID = process.env.VK_CLIENT_ID;
const CLIENT_SECRET = process.env.VK_CLIENT_SECRET;
const REDIRECT_URI = "https://vk-auth-backend-pfj7.onrender.com/vk/callback";

// 1. старт авторизации
app.get("/vk/auth", (req, res) => {
    const url = `https://id.vk.com/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=groups,wall,messages,offline`;

    res.redirect(url);
});

// 2. callback
app.get("/vk/callback", async (req, res) => {
    const { code } = req.query;

    try {
        const response = await fetch("https://id.vk.com/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI
            })
        });

        const data = await response.json();

        res.json(data); // тут придёт access_token
    } catch (e) {
        res.send("error");
    }
});

app.listen(10000);
