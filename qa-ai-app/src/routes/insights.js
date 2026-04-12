import express from "express";
import { getHistory } from "../services/historyService.js";
import { generateInsights } from "../services/insightService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const history = getHistory();

    // 🔹 debug opcional
    console.log("HISTORY LENGTH:", history.length);

    if (!history.length) {
      return res.json({
        insights: ["No data available yet"]
      });
    }

    const insights = await generateInsights(history);

    res.json(insights);
  } catch (err) {
    console.error("INSIGHTS ERROR:", err);

    res.status(500).json({
      error: "Failed to generate insights"
    });
  }
});

export default router;
