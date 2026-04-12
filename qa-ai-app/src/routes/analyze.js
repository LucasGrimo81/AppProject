import express from "express";
import { generateQA } from "../services/aiService.js";
import { saveExecution } from "../services/historyService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const result = await generateQA(input);
    
    const savedUS = saveExecution(result);
    
    res.json(savedUS);

  } catch (error) {
    console.error("ERROR DETALLE:", error?.response?.data || error.message);
    res.status(500).json({
      error: "Internal error",
      detail: error?.response?.data || error.message
    });
  }
});

export default router;