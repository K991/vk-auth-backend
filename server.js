import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// 🔐 ТВОИ ДАННЫЕ VK
const VK_CLIENT_ID = "54520140";
const VK_CLIENT_SECRET = "4309a35d4309a35d4309a35dc240364a11443094309a35d2ac48299798c621a4bf21d82";

// ⚠️ ОБЯЗАТЕЛЬНО тот же redirect_uri, что в VK
const REDIRECT_URI = "https://vk-auth-backend-pfj7.onrender.com/vk/callback";

// временное хранилище
const sessions = new Map();

// 🚀 1. Старт авторизации
app.get("/vk/auth/start", (req, res) => {
    const sessionId = crypto.randomUUID();

    const authUrl = `https://oauth.vk.com/authorize?client_id=${VK_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=offline`;

    sessions.set(sessionId, { status: "pending" });

    res.json({
        sessionId,
        authUrl
    });
});

// 🔁 2. Callback от VK
app.get("/vk/callback", async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await fetch(
            `https://oauth.vk.com/access_token?client_id=${VK_CLIENT_ID}&client_secret=${VK_CLIENT_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`
        );

        const data = await tokenResponse.json();

        // найдём первую pending-сессию
        let sessionId = null;
        for (let [key, value] of sessions.entries()) {
            if (value.status === "pending") {
                sessionId = key;
                break;
            }
        }

        if (sessionId) {
            sessions.set(sessionId, {
                status: "done",
                accessToken: data.access_token,
                userId: data.user_id
            });
        }

        res.send("OK, можно закрыть окно");
    } catch (e) {
        res.send("Ошибка авторизации");
    }
});

// 🔍 3. Проверка статуса
app.get("/vk/auth/status", (req, res) => {
    const { sessionId } = req.query;

    const session = sessions.get(sessionId);

    if (!session) {
        return res.json({ status: "error", error: "Session not found" });
    }

    res.json(session);
});

// старт сервера
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
