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



router.post("/generate-from-coverage", async (req, res) => {
  const { us, uncovered } = req.body;

  const safeAC = uncovered
  .filter(Boolean) // elimina null
  .map(ac => {
    if (typeof ac === "string") {
      return {
        scenario: "",
        given: ac,
        when: "",
        then: ""
      };
    }

    return {
      scenario: ac?.scenario || "",
      given: ac?.given || "",
      when: ac?.when || "",
      then: ac?.then || ""
    };
  });

  const prompt = `
You are a senior QA engineer.

Generate high-value test cases ONLY for uncovered acceptance criteria.

UNCOVERED ACCEPTANCE CRITERIA:
${safeAC.map((ac, i) => `
AC-${i+1}:
Scenario: ${ac.scenario}
Given ${ac.given}
When ${ac.when}
Then ${ac.then}
`).join("\n")}

RULES:
- Focus on missing coverage
- Do not repeat existing tests
- Include edge cases
- Include negative scenarios

Return JSON:
{
  "suggestions": [
    {
      "title": "...",
      "priority": "high|medium|low"
    }
  ]
}
`;

  // llamada a IA igual que ya tenés
});

export default router;

