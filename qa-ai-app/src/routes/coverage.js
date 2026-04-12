import express from "express";
import { generateCoverage } from "../services/coverageService.js";
import fs from "fs";

const router = express.Router();
const FILE = "./data/history.json"

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 LEER SIEMPRE EL ARCHIVO ACTUALIZADO
    const raw = fs.readFileSync(FILE, "utf-8");
    const data = JSON.parse(raw);

    const us = data.find(u => u.id === id);

    console.log("FOUND US", us)
    if (!us) return res.status(404).json({ error: "US not found" });

    const coverage = await generateCoverage(us);

    res.json(coverage);
  } catch (err) {
    console.error("COVERAGE ERROR:", err);
    res.status(500).json({ error: "Coverage failed" });
  }
});

export default router;
