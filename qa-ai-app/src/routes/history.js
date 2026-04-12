import fs from "fs";
import express from "express";

const router = express.Router();
const FILE = "./data/history.json";

export const getHistory = (req, res) => {
  if (!fs.existsSync(FILE)) {
    return res.json([]);
  }

  const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));

  if (req.query.full === "true") {
    return res.json(data); // completo
  }

  const summarized = data.map(item => ({
    id: item.id,
    timestamp: item.timestamp,
    title: item.title, // ✅ AGREGAR
    feature_type: item.feature_type,
    user_story: item.user_story,
    acceptance_criteria: item.acceptance_criteria, // ✅ AGREGAR
    metrics: item.metrics
  }));

  res.json(summarized);
};

// ADD TEST CASE
router.post("/add-test-case", (req, res) => {
  try {
    const { usId, testCase } = req.body;

    const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));

    const us = data.find(u => u.id === usId);

    if (!us) {
      return res.status(404).json({ error: "US not found" });
    }

    // 🟢 agregar test case
    us.test_cases = us.test_cases || [];
    us.test_cases.push(testCase);

    // 🔥 RECALCULAR METRICS
    us.metrics = {
      ...us.metrics,
      test_count: us.test_cases.length
    };

    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error("❌ ADD TC ERROR:", err);
    res.status(500).json({ error: "Failed to add test case" });
  }
});

//REFRESH DE DATA PARA TRAER LOS TCs CREADOS POR SUGGESTION
 router.post("/recalculate", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));

    const updated = data.map(us => {
      const testCount = us.test_cases?.length || 0;
      const riskCount = us.risks?.length || 0;
      const highRisk = us.risks?.filter(r => r.risk_level === "high").length || 0;

      return {
        ...us,
        metrics: {
          ...us.metrics,
          test_count: testCount,
          risk_count: riskCount,
          high_risk: highRisk
        }
      };
    });

    fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error("❌ RECALCULATE ERROR:", err);
    res.status(500).json({ error: "Recalculate failed" });
  }
});

  export default router;