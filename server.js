const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");

const app = express();
app.use(cors());

// Multer for file uploads (memory storage)
const upload = multer();

// For JSON fields
app.use(express.json());

const OPENAI_API_KEY = "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";
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

app.post("/api/summarize", upload.single("pdfFile"), async (req, res) => {
  try {
    const file = req.file;
    const outputType = req.body.outputType;

    if (!file) return res.status(400).json({ error: "No PDF uploaded" });

    // Convert file buffer to base64
    const base64PDF = file.buffer.toString("base64");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            outputType === "short"
              ? `Summarize this PDF briefly:\n\n${base64PDF}`
              : `Provide a detailed summary of this PDF:\n\n${base64PDF}`,
        },
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
