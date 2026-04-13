import axios from "axios";

export const generateCoverage = async (us) => {
  try {
    // 🧠 NORMALIZACIÓN SEGURA
    const acList = Array.isArray(us.acceptance_criteria)
      ? us.acceptance_criteria
      : us.acceptance_criteria
        ? [us.acceptance_criteria]
        : [];

    const testCases = Array.isArray(us.test_cases)
      ? us.test_cases
      : [];

    if (acList.length === 0) {
      return { coverage: [] };
    }

    // 🧠 FORMATEO PARA IA (sin perder estructura)
    const formattedAC = acList.map((ac, i) => ({
      id: `AC-${i + 1}`,
      scenario: ac.scenario || `Scenario ${i + 1}`,
      given: ac.given || "",
      when: ac.when || "",
      then: ac.then || ""
    }));

    const formattedTC = testCases.map((tc, i) => ({
      id: `TC-${i + 1}`,
      title: tc.title || "",
      steps: tc.steps || [],
      expected: tc.expected_result || ""
    }));

    if (!us.test_cases || us.test_cases.length === 0) {
      return {
        coverage: [],
        total: 0,
        covered: 0
      };
    }
  
  const prompt = `
You are a senior QA expert.

Your task is STRICTLY to evaluate coverage between acceptance criteria and test cases.

ACCEPTANCE CRITERIA (DO NOT MODIFY):
${formattedAC.map(ac => `
${ac.id} - ${ac.scenario}
Given ${ac.given}
When ${ac.when}
Then ${ac.then}
`).join("\n")}

TEST CASES:
${formattedTC.map(tc => `
${tc.id}: ${tc.title}
Steps: ${tc.steps.join(", ")}
Expected: ${tc.expected}
`).join("\n")}

RULES (VERY IMPORTANT):
- Return ONLY valid JSON.
- Do NOT include explanations.
- Do NOT include markdown.
- Do NOT include text before or after JSON.
- DO NOT create new acceptance criteria
- DO NOT infer additional scenarios
- DO NOT split acceptance criteria
- ONLY evaluate the EXACT acceptance criteria provided
- Each output item MUST correspond 1:1 with the original acceptance criteria
- If there are 3 acceptance criteria, return EXACTLY 3 results
- DO NOT add extra items
- Return EXACTLY ${formattedTC.length} items

TASK:
For each acceptance criteria:
- Determine if it is covered
- Identify matching test cases
- Be strict but fair

Return ONLY JSON:

{
  "coverage": [
    {
      "ac_id": "AC-1"
      "acceptance_criteria": "EXACT original text",
      "covered": true,
      "matching_test_cases": ["TC-1"],
      "reason": "short explanation"
    }
  ]
}
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

let content = response.data.choices[0].message.content;

  // 🔥 1. limpiar markdown
  content = content.replace(/```json|```/g, "").trim();

  // 🔥 2. extraer SOLO el JSON
  const match = content.match(/\{[\s\S]*\}/);

  if (!match) {
    console.error("❌ No JSON found in response:", content);
    return { coverage: [] };
  }

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ JSON parse failed:", err);
    console.error("RAW:", content);

    return { coverage: [] };
  }

  } catch (err) {
    console.error("❌ COVERAGE ERROR:", err);
    return { coverage: [] };
  }
};