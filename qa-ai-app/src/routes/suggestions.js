import express from "express";
import { generateSuggestions } from "../services/suggestionService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user_story, acceptance_criteria, test_cases } = req.body;
    console.log("👉 SUGGESTIONS BODY:", req.body);
    
    if (!req.body.acceptance_criteria) {
        return res.status(400).json({ error: "Missing AC" });
    }
    
    const suggestions = await generateSuggestions({
      user_story,
      acceptance_criteria,
      test_cases
    });

    res.json(suggestions);
  } catch (err) {
    console.error("SUGGESTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;