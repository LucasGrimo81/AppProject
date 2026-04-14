import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { useMemo } from "react";  

function History() {
  const [history, setHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState("all");
  const [insights, setInsights] = useState([]);
  const [selectedUS, setSelectedUS] = useState(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [globalInsights, setGlobalInsights] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [coverageSuggestions, setCoverageSuggestions] = useState({});

  const features = ["all", ...new Set(history.map(h => h.feature_type))];
  
  const COLORS = {
    high: "#ef4444",     // rojo
    tests: "#3b82f6",    // azul
    risks: "#f59e0b"     // amarillo
  };
  const CHART_HEIGHT = 320;
  
  useEffect(() => {
    loadHistory();
    loadInsights();
    loadFullHistory();
  }, []);

  useEffect(() => {
    if (selectedUS?.id) {
      loadCoverage(selectedUS.id);
    }
  }, [selectedUS]);

  const loadCoverage = async (usId) => {
      try {
        const res = await fetch(`http://localhost:3000/coverage/${usId}`);
        const data = await res.json();

        console.log("📊 COVERAGE:", data);

        setCoverage(data);
      } catch (err) {
        console.error("❌ Coverage fetch error:", err);
      }
    };

  
  {/* REESET PARA CERRAR EL MODAL */}
  const handleCloseModal = () => {
    setSelectedUS(null);
    setCoverage(null);
    setCoverageSuggestions({});
  };

  const loadHistory = async () => {
    const res = await fetch("http://localhost:3000/history");
    const data = await res.json();

    setHistory(data);
    setFilteredHistory(data); // 👈 importante
  };    

  // 📦 para detalle
  const loadFullHistory = async () => {
    const res = await fetch("http://localhost:3000/history?full=true");
    const data = await res.json();
    setFullHistory(data);
  };

  const loadInsights = async () => {
    const res = await fetch("http://localhost:3000/insights");
    const data = await res.json();
    setInsights(data.insights || []);
  };

  // GENERAR SUGGESTIONS
 
  const generateTCSuggestion = async (index) => {
     const originalAC = selectedUS.acceptance_criteria[index];

     const cleanAC = {
      scenario: originalAC?.scenario,
      given: originalAC?.given,
      when: originalAC?.when,
      then: originalAC?.then
    };

     const payload = {
      user_story: selectedUS?.title || selectedUS?.user_story || "",
      acceptance_criteria: [cleanAC],
      test_cases: selectedUS?.test_cases || []
    };
      console.log("📤 PAYLOAD:", payload);

    try {
      const res = await fetch("http://localhost:3000/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      console.log("✅ Suggestions:", data);

      setCoverageSuggestions(prev => ({
        ...prev,
        [index]: data.suggestions || []
      }));

    } catch (err) {
      console.error("❌ Suggestion error:", err);
    }
  };

  // AGREGAR SUGGESTIONS
const addSuggestionAsTC = async (suggestion) => {
  try {
    // 1. guardar en backend
    await fetch("http://localhost:3000/history/add-test-case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usId: selectedUS.id,
        testCase: suggestion
      })
    });

    // 2. traer history actualizado
    const res = await fetch("http://localhost:3000/history?full=true");
    const updatedHistory = await res.json();

    const updatedUS = updatedHistory.find(u => u.id === selectedUS.id);

    // 3. actualizar UI
    setFullHistory(updatedHistory);
    setSelectedUS(updatedUS);

    // 4. 🔥 recalcular coverage (CLAVE)
    await loadCoverage(updatedUS.id);

    // 5. limpiar suggestions
    setCoverageSuggestions({});

  } catch (err) {
    console.error("❌ Add TC error:", err);
  }
};


  {/* SECCION DE KPIs */}
  const totalUS = filteredHistory.length;

  const totalRisks = filteredHistory.reduce(
    (acc, item) => acc + item.metrics.risk_count,
    0
  );

  const totalHighRisks = filteredHistory.reduce(
    (acc, item) => acc + item.metrics.high_risk,
    0
  );

  const totalTests = filteredHistory.reduce(
    (acc, item) => acc + item.metrics.test_count,
    0
  );

  const avgTests = totalUS ? (totalTests / totalUS).toFixed(1) : 0;

  const highRiskPercentage = totalRisks
    ? ((totalHighRisks / totalRisks) * 100).toFixed(1)
    : 0;

  const qualityScore = totalRisks
  ? (100 - (totalHighRisks / totalRisks) * 100).toFixed(0)
  : 100;

  const handleFilterChange = (feature) => {
    setSelectedFeature(feature);

    if (feature === "all") {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(
        history.filter(h => h.feature_type === feature)
      );
    }
  };

  {/* AGRUPA DATA PARA MOSTRAR EN LOS GRAFICOS */}
  const groupedData = Object.values(
    filteredHistory.reduce((acc, item) => {
      const key = item.feature_type || "unknown";

      if (!acc[key]) {
        acc[key] = {
          feature_type: key,
          total_tests: 0,
          total_risks: 0,
          high_risks: 0,
          ids: [] // 👈 nuevo
        };
      }

      acc[key].total_tests += item.metrics.test_count;
      acc[key].total_risks += item.metrics.risk_count;
      acc[key].high_risks += item.metrics.high_risk;
      acc[key].ids.push(item.id); // 👈 clave

      return acc;
    }, {})
  );

  {/* TRAER DATA DE LAS HISTORIAS */}
  const usData = fullHistory.map((item) => ({
    id: item.id,
    title: item.title,
    acceptance_criteria: item.acceptance_criteria,
    user_story: item.user_story,
    timestamp: item.timestamp,
    feature_type: item.feature_type,
    risks: item.metrics.risk_count,
    high_risks: item.metrics.high_risk
  }));

  const sortedUsData = [...usData].sort((a, b) => {
    if (a.feature_type === b.feature_type) return 0;
    return a.feature_type > b.feature_type ? 1 : -1;
  });

  {/* CUSTOMIZAR LOS TOOLTIP QUE SE MUESTRAN EN GRAFICO */}
  const CustomTooltipUS = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      if (!data) return null; // 👈 evita crash

      return (
        <div className="bg-white p-3 border rounded shadow text-sm">
          <p className="font-bold">{data.id}</p>
          <p>Feature: {data.feature_type}</p>
          <p>Risks: {data.risks}</p>
          <p>High: {data.high_risks}</p>
        </div>
      );
    }
    return null;
  };

  {/* DAR COLORES A LAS FEATURES EN GRAFICO */}
  const featureColors = {};

  const getFeatureColor = (feature) => {
    if (!featureColors[feature]) {
      const colors = [
        "#3b82f6", // azul
        "#ef4444", // rojo
        "#10b981", // verde
        "#f59e0b", // naranja
        "#8b5cf6", // violeta
        "#ec4899"  // rosa
      ];

      featureColors[feature] =
        colors[Object.keys(featureColors).length % colors.length];
    }

    return featureColors[feature];
  };

  {/* ORDENAR INSIGHTS EN EL MODAL */}
  const severityOrder = {
    critical: 1,
    warning: 2,
    info: 3
  };

  const sortedInsights = [...insights].sort(
    (a, b) => severityOrder[a.type] - severityOrder[b.type]
  );

  {/* MUESTRA y ORDENA LOS TCs POR PRIORIDAD EN EL MODAL */}
  const enrichedTestCases = useMemo(() => {
    if (!selectedUS?.test_cases) return [];

    const highRisks = selectedUS.risks?.filter(r => r.risk_level === "high").length;

    const enriched = selectedUS.test_cases.map((tc, index) => {
      let priority = tc.priority || "low";

      if (index < highRisks) priority = "high";
      else if (index < highRisks + 2) priority = "medium";

      return { ...tc, priority };
    });

    // 🔥 ORDENAR POR PRIORIDAD
    return enriched.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    });

  }, [selectedUS]);

  const visibleTestCases = showCriticalOnly
  ? enrichedTestCases.filter(tc => tc.priority === "high")
  : enrichedTestCases;
  
  const filteredInsights = globalInsights.filter(ins =>
    ins.message?.includes(selectedUS?.id)
  );

  {/* ORDENAR RISKS EN EL MODAL */}
  const riskOrder = { high: 3, medium: 2, low: 1 };

  const sortByRisk = (risks = []) => {
    return [...risks].sort(
      (a, b) => riskOrder[b.risk_level] - riskOrder[a.risk_level]
    );
  };

  {/* NORMALIZAR EL AC */}
/*  const normalizeAC = (text = "") => {
    return text
      .replace(/\n+/g, " ") // elimina saltos raros
      .replace(/\s+/g, " ") // limpia espacios
      .replace(/(Given|When|Then)/g, "\n$1") // salto antes de cada keyword
      .trim();
  };

  const formattedAC = normalizeAC(selectedUS?.acceptance_criteria);

  const criteriaList =
    formattedAC.split(/(?=Given)/g) || [];
*/
  const acList = Array.isArray(selectedUS?.acceptance_criteria)
  ? selectedUS.acceptance_criteria
  : selectedUS?.acceptance_criteria
    ? [selectedUS.acceptance_criteria]
    : []
    ;

    const autoFixCoverage = async () => {
      const uncovered = coverage.coverage
        .filter(c => !c.covered)
        .map(c => c.acceptance_criteria);

      if (uncovered.length === 0) return;

      const res = await fetch("http://localhost:3000/suggestions/generate-from-coverage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          us: selectedUS,
          uncovered
        })
      });

      const data = await res.json();

      // 🔥 agregar todos los test cases automáticamente
      for (const tc of data.suggestions) {
        await addSuggestionAsTC(tc);
      }
    };

   return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard QA</h1>

      {/* FILTRO POR FEATURE*/}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Filtrar por Feature:</label>

        <select
          value={selectedFeature}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="border p-2 rounded"
        >
          {features.map((f, i) => (
            <option key={i} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      
      {/* Insights */}
      <div className="space-y-3">
        <h2 className="font-bold mb-3">AI Insights</h2>
        {sortedInsights.map((insight, index) =>(
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === "critical"
                ? "border-red-500 bg-red-50"
                : insight.type === "warning"
                ? "border-yellow-500 bg-yellow-50"
                : "border-blue-500 bg-blue-50"
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {insight.message}
            </p>

            <p className="text-xs text-gray-600">
              👉 {insight.recommendation}
            </p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-6">

      {/* Total US */}
      <div className="bg-white p-4 rounded-xl shadow-md text-center">
        <p className="text-sm text-gray-500">User Stories</p>
        <p className="text-2xl font-bold">{totalUS}</p>
      </div>

      {/* Total Risks */}
      <div className="bg-white p-4 rounded-xl shadow-md text-center">
        <p className="text-sm text-gray-500">Total Risks</p>
        <p className="text-2xl font-bold">{totalRisks}</p>
      </div>

      {/* High Risk % */}
      <div className="bg-white p-4 rounded-xl shadow-md text-center">
        <p className="text-sm text-gray-500">% High Risk</p>
        <p className={`text-2xl font-bold ${
          highRiskPercentage > 50
            ? "text-red-500"
            : highRiskPercentage > 25
            ? "text-yellow-500"
            : "text-green-500"
        }`}>
          {highRiskPercentage}%
        </p>
      </div>

      {/* Avg Tests */}
      <div className="bg-white p-4 rounded-xl shadow-md text-center">
        <p className="text-sm text-gray-500">Avg Tests / US</p>
        <p className="text-2xl font-bold">{avgTests}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-md text-center ">
        <p className="text-sm text-gray-500">Quality Score</p>
        <p className="text-3xl font-bold">{qualityScore}/100</p>
      </div>

    </div>

      {/* 📊 GRÁFICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white p-4 rounded-xl shadow-md flex flex-col">
          <h2 className="font-bold mb-4 text-center">
            Riesgos por User Story
          </h2>

          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={sortedUsData}
              margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="id" hide />
              

              <YAxis
                label={{
                  value: "Riesgos",
                  angle: -90,
                  position: "insideLeft"
                }}
              />

              <Tooltip
                content={<CustomTooltipUS />}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />

              <Bar dataKey="risks" name="Risks">
                {sortedUsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getFeatureColor(entry.feature_type)}
                  />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
                    
      
          {/* 👇 LEYENDA */}
          <div className="flex gap-4 mt-4 flex-wrap justify-center">
            {Object.keys(featureColors).map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: featureColors[feature]
                  }}
                />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <h2 className="font-bold mb-4 text-center">
            Tests vs Riesgos
          </h2>

          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={groupedData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="feature_type"
                angle={-20}
                textAnchor="end"
                interval={0}
                height={60}
                label={{ value: "Feature", position: "insideBottom", offset: -10 }}
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="total_tests"
                name="Tests"
                fill={COLORS.tests}
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="total_risks"
                name="Riesgos"
                fill={COLORS.risks}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
      </div>

      {/* 📋 LISTADO */}
      <div className="mt-6">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              const fullUS = fullHistory.find(h => h.id === item.id);

              setSelectedUS(fullUS);

              if (fullUS?.id) {
                loadCoverage(fullUS.id); // 👈 CLAVE
              }
            }}
            className="cursor-pointer bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <div className="flex justify-between">
              <b>{item.id}-{item.title}</b>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              Feature Type: {item.feature_type}
            </div>

            <div className="text-sm mt-2 flex gap-4">
              <span>🧪 {item.metrics.test_count}</span>
              <span>⚠️ {item.metrics.risk_count}</span>
              <span className="text-red-600">
                🔥 {item.metrics.high_risk}
              </span>
              
            </div>
          </div>
        ))}
      </div>

      {selectedUS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
         
          <div className="bg-white w-[90%] max-w-3xl p-6 rounded-xl shadow-xl overflow-y-auto max-h-[90vh]">
            {/* 🚨 ALERTA CRÍTICA */}
            {selectedUS.metrics?.high_risk > 0 && (
              <div className="bg-red-200 text-red-800 p-2 rounded mb-4 font-semibold">
                🚨 High Risk Detected in this User Story
              </div>
            )}
            
            {/* ❌ cerrar */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedUS.id} - {selectedUS.feature_type}
              </h2>
              <button
                onClick={() => {
                  handleCloseModal();
                }}
                className="text-red-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* 📘 USER STORY */}
            <div className="mb-4">
              <h3 className="font-semibold mb-1">User Story</h3>
              <p className="text-sm text-gray-700">
                {selectedUS.user_story}
              </p>
            </div>

            {/* 📋 ACCEPTANCE CRITERIA */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Acceptance Criteria</h3>

                  {acList.map((ac, i) => (
                    
                    <div key={i} className="mb-3 p-3 bg-gray-50 rounded">

                      {ac.scenario && (
                        <p className="font-semibold">{ac.scenario}</p>
                      )}

                      <p><strong>Given:</strong> {ac.given}</p>
                      <p><strong>When:</strong> {ac.when}</p>
                      <p><strong>Then:</strong> {ac.then}</p>

                    </div>
                  ))}
                </div>

            {/* ⚠️ RISKS */}
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Risks</h3>
              <ul className="space-y-2">
                {sortByRisk(selectedUS.risks)?.map((r, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded ${
                      r.risk_level === "high"
                        ? "bg-red-100"
                        : r.risk_level === "medium"
                        ? "bg-yellow-100"
                        : "bg-green-100"
                    }`}
                  >
                    <strong>{r.type}</strong>: {r.description}
                  </li>
                ))}
              </ul>
            </div>


            {/* 📊 COVERAGE */}
            {coverage && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Coverage (
                    {coverage?.coverage?.filter(c => c.covered).length || 0}
                    /
                    {coverage?.coverage?.length || 0}
                  )
                </h3>

                <div className="space-y-3">
                  {!coverage ? (
                      <p>Loading coverage...</p>
                    ) : coverage.coverage?.length === 0 ? (
                      <p>No coverage available</p>
                    ) : (coverage.coverage.map((c, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded border ${
                        c.covered ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                      }`}
                    >
                      <p className="font-semibold mb-1">
                        {c.scenario}
                      </p>

                      {/*<p><strong>Given:</strong> {c.given}</p>
                      <p><strong>When:</strong> {c.when}</p>
                      <p><strong>Then:</strong> {c.then}</p>
                      */}

                      <p className="mt-2 text-sm">
                        <strong>Status:</strong> {c.covered ? "Covered ✅" : "Not Covered ❌"}
                      </p>

                      {c.matching_test_cases?.length > 0 && (
                        <p className="text-sm">
                          <strong>Matched:</strong> {c.matching_test_cases.join(", ")}
                        </p>
                      )}

                      <p className="text-xs text-gray-600 mt-1">
                        {c.reason}
                      </p>


                      {!c.covered && (
                        <button
                          onClick={autoFixCoverage}
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Auto Fix Coverage
                        </button>
                      )}
                      

                      {!c.covered && (
                        <button
                          onClick={() => generateTCSuggestion(i)}
                          className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          Generate Test Case
                        </button>
                      )}
                      {coverageSuggestions[i]?.map((s, idx) => (
                        <div key={idx} className="bg-yellow-50 p-2 rounded mt-2">
                          
                          <p className="font-medium">{s.title}</p>

                          <span className={`text-xs px-2 py-1 rounded ${
                            s.priority === "high"
                              ? "bg-red-200"
                              : s.priority === "medium"
                              ? "bg-yellow-200"
                              : "bg-green-200"
                          }`}>
                            {s.priority}
                          </span>

                          <button
                            onClick={() => addSuggestionAsTC(s)}
                            className="block mt-1 text-green-600 text-sm"
                          >
                            Add Test Case
                          </button>

                        </div>
                      ))}
                    </div>
                  )))}
                  
                </div>
              </div>
            )}       

            {/* ✅ TEST CASES */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Test Cases</h3>

                <button
                  onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                  className={`text-sm px-3 py-1 rounded ${
                    showCriticalOnly
                      ? "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  🔥 {showCriticalOnly ? "Showing Critical Only" : "Run Critical Only"}
                </button>
              </div>

              <div className="space-y-2">
                
                {visibleTestCases?.map((tc, i) =>(
                  <details
                    key={i}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <summary className="cursor-pointer flex justify-between items-center">
                      <span className="font-medium">{tc.title}</span>

                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          tc.priority === "high"
                            ? "bg-red-200 text-red-800"
                            : tc.priority === "medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {tc.priority}
                      </span>
                    </summary>

                    {/* 👇 CONTENIDO */}
                    <div className="mt-3 text-sm text-gray-700">
                      
                      {/* Steps */}
                      <div className="mb-2">
                        <strong>Steps:</strong>
                        <ul className="list-disc ml-5">
                          {tc.steps?.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Expected */}
                      <div>
                        <strong>Expected:</strong>
                        <p>{tc.expected_result}</p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
    
  );
}

export default History;