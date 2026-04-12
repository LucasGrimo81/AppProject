import express from "express";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";
import cors from "cors";
import { getHistory } from "./routes/history.js";
import historyRoutes from "./routes/history.js";
import insightsRoutes from "./routes/insights.js";
import coverageRoutes from "./routes/coverage.js";
import suggestionRoutes from "./routes/suggestions.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/analyze", analyzeRoute);
app.use("/history", historyRoutes);
app.use((req, res, next) => {
  console.log("👉 REQUEST:", req.method, req.url);
  next();
});
app.get("/history", getHistory);
app.use("/insights", insightsRoutes);
app.use("/coverage", coverageRoutes);
app.use("/suggestions", suggestionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});