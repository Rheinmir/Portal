import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initDatabase } from "./database.js";
import apiRoutes from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 5464;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Static files (Frontend build)
if (fs.existsSync(path.join(rootDir, "dist"))) {
  app.use(express.static(path.join(rootDir, "dist")));
}

// Serve temp images for Google Lens search
const tempDir = path.join(rootDir, "data", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
app.use("/temp", express.static(tempDir));

// Database Init
initDatabase();

// Routes
app.use("/api", apiRoutes);

// Fallback for SPA
app.get("*", (req, res) => {
  const indexPath = path.join(rootDir, "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('No build found. Please run "npm run build".');
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
