import axios from "axios";
import { buildPrompt } from "./promptBuilder.js";
import JSON5 from "json5";

const MODELS = [
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant"
];

const normalizeRiskLevel = (desc = "") => {
  const text = desc.toLowerCase();

  if (
    text.includes("security") ||
    text.includes("duplicate") ||
    text.includes("data loss") ||
    text.includes("payment")
  ) return "high";

  if (
    text.includes("timeout") ||
    text.includes("integration")
  ) return "medium";

  return "low";
};

const cleanResponse = (content) => {
  return content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

export const generateQA = async (input) => {
  const prompt = buildPrompt(input);

  for (const model of MODELS) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const cleaned = cleanResponse(content);

      try {
        let parsed = JSON5.parse(cleaned);

        // 🔥 NORMALIZACIÓN (CLAVE)
        parsed = {
          title: parsed.title || "",
          user_story: parsed.user_story || "",
          feature_type: parsed.feature_type || "general",
          acceptance_criteria: parsed.acceptance_criteria || [],
          risks: (parsed.risks || []).map(r => ({
            type: r.type || "unknown",
            description: r.description || "",
            risk_level: r.risk_level || normalizeRiskLevel(r.description)
          })),
          test_cases: (parsed.test_cases || []).map(tc => ({
            title: tc.title || "",
            steps: tc.steps || [],
            expected_result: tc.expected_result || "",
            priority: tc.priority || "medium"
          }))
        };

        return parsed;

      } catch (err) {
        console.log("Error parseando JSON con modelo:", model);
      }

    } catch (err) {
      console.log("ERROR CON MODELO:", model);
      console.log(err.response?.data || err.message);
    }
  }

  // 🔥 FALLBACK SIEMPRE VÁLIDO
  return {
    title: "undefined",
    user_story: input,
    feature_type: "unknown",
    acceptance_criteria: [],
    risks: [],
    test_cases: [],
    error: "No se pudo generar respuesta válida"
  };
};