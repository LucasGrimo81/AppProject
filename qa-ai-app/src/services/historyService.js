import fs from "fs";

const FILE_PATH = "./data/history.json";

// 🔹 leer history (si no existe, lo crea)
export const getHistory = () => {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
    return [];
  }

  const data = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(data);
};

// 🔹 guardar un nuevo registro
export const saveExecution = (data) => {
  let history = [];

  if (fs.existsSync(FILE_PATH)) {
    const fileContent = fs.readFileSync(FILE_PATH, "utf-8");
    history = fileContent ? JSON.parse(fileContent) : [];
  }

  const nextId = `US-${(history.length + 1).toString().padStart(3, "0")}`;

  console.log("AI RESULT:", data);

  const newEntry = {
    id: nextId,
    timestamp: new Date().toISOString(),

    // 🆕 BA FIELDS
    title: data.title || "Untitled Feature",
    acceptance_criteria: data.acceptance_criteria || "",

    // existentes
    feature_type: data.feature_type,
    user_story: data.user_story,

    risks: data.risks || [],
    test_cases: data.test_cases || [],

    metrics: {
      risk_count: data.risks?.length || 0,
      high_risk: (data.risks || []).filter(r => r.risk_level === "high").length,
      test_count: data.test_cases?.length || 0
    }
  };

  history.push(newEntry);

  fs.writeFileSync(FILE_PATH, JSON.stringify(history, null, 2));

  return newEntry;
};