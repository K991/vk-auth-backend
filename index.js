const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("VK auth backend is running");
});

app.post("/vk/exchange", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    return res.json({
      ok: true,
      received_code: code
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