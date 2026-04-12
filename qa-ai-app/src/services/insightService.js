import axios from "axios";

export const generateInsights = async (history) => {
  // 🔹 compactar datos (muy importante)
  const compactHistory = history.map((h) => ({
    id: h.id,
    feature_type: h.feature_type,
    risk_count: h.metrics?.risk_count,
    high_risk: h.metrics?.high_risk,
    test_count: h.metrics?.test_count,
    risk_ratio: h.metrics?.risk_count
        ? (h.metrics.high_risk / h.metrics.risk_count).toFixed(2)
        : 0
    }));

  const prompt = `
    You are a senior QA Lead analyzing test results.

    Your goal is NOT to summarize data, but to provide actionable insights.

    DATA:
    ${JSON.stringify(compactHistory)}

    ANALYZE AND IDENTIFY:

    1. Which feature is the most critical and why
    2. Which user story (US) is the riskiest
    3. Where test coverage is insufficient
    4. Any risk concentration patterns
    5. Where QA should focus next

    IMPORTANT RULES:
    - Do NOT restate raw numbers
    - Do NOT describe obvious data
    - Provide conclusions and reasoning
    - Be specific (mention feature names and US IDs)
    - Focus on conclusions and prioritization
    - Include recommendations   
    - Suggest test types (integration, edge cases, regression)
    - Suggest priority level

    Return ONLY JSON:

    {
    "insights": [
        {
            "type": "critical | warning | info",
            "message": "insight explanation",
            "recommendation": "specific QA action"
        }
    ]
    }
    `;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
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

  let content = response.data.choices[0].message.content;

    // limpiar markdown
    content = content.replace(/```json|```/g, "").trim();

    try {
    return JSON.parse(content);
    } catch (e) {
    console.warn("⚠️ JSON parse failed, trying extraction...");

    // intentar extraer bloque JSON dentro del texto
    const match = content.match(/\{[\s\S]*\}/);

    if (match) {
        try {
        return JSON.parse(match[0]);
        } catch (err) {
        console.error("❌ Extraction parse failed:", err);
        }
    }

    console.error("Raw model output:", content);

    return {
        insights: ["Error parsing AI response"]
    };
    }
};