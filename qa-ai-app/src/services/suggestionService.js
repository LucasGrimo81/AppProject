import axios from "axios";

export const generateSuggestions = async ({ user_story, acceptance_criteria, test_cases }) => {
  const formattedAC = acceptance_criteria.map((ac, i) => `
    AC-${i + 1}: ${ac.scenario || "Scenario"}

    Given ${ac.given}
    When ${ac.when}
    Then ${ac.then}
    `).join("\n");

  const prompt = `
You are a senior QA engineer.

Your goal is to suggest ADDITIONAL test scenarios.

IMPORTANT:
- DO NOT repeat existing test cases
- DO NOT restate acceptance criteria
- Focus ONLY on missing edge cases, risks, and uncommon scenarios

USER STORY:
${user_story}

ACCEPTANCE CRITERIA:
${formattedAC}

EXISTING TEST CASES:
${test_cases.map(tc => `- ${tc.title}`).join("\n")}

OUTPUT:
Return ONLY JSON:

{
  "suggestions": [
    {
      "title": "short test case title",
      "steps": ["step 1", "step 2"],
      "expected_result": "string",
      "type": "edge | negative | performance | security",
      "priority": "high | medium | low"
    }
  ]
}
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  let content = response.data.choices[0].message.content;

  content = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Suggestions parse error:", content);
    return { suggestions: [] };
  }
};