import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { config } from "dotenv";
config();
import { geminiService } from "./server/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" })); // for documents

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/:method", async (req, res) => {
    try {
      const method = req.params.method as keyof typeof geminiService;
      if (!geminiService[method]) {
         return res.status(404).json({ error: "Method not found" });
      }
      const args = req.body.args || [];
      const result = await (geminiService[method] as any)(...args);
      res.json({ result });
    } catch (err: any) {
      console.error(`Gemini Error [${req.params.method}]:`, err.message);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
