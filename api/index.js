import express from "express";
import cors from "cors";
import { initDatabase } from "../server/database.js";
import apiRoutes from "../server/routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Database Init
initDatabase();

// Routes
// Note on Vercel: The vercel.json rewrites /api/(.*) to /api/index.js
// Thus, the path here should just match what the router expects.
// If your frontend requests /api/data, and vercel.json rewrites it to /api/index.js,
// Express inside the serverless function will still see the request URL as /api/data
app.use("/api", apiRoutes);

// Export for Vercel
export default app;
