import { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { Routes, Route } from "react-router-dom";
import Home from "pages/Home";
import History from "./pages/History";

function App() {
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState("general");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, domain }),
      });

      const data = await res.json();
      console.log("RESPONSE:", data); // 👈 debug

      setResponse(data);
    } catch (err) {
      console.error(err);
      setResponse({ error: "Error calling backend" });
    }

    setLoading(false);
  };
/*
  if (!response || (!response.test_cases && !response.risks)) {
    console.error("Invalid response for export:", response);
    alert("No hay datos válidos para exportar");
    return;
  }
*/
  const loadHistory = async () => {
    const res = await fetch("http://localhost:3000/history");
    const data = await res.json();

    setHistory(data);
    setShowHistory(true); // 👈 solo acá
  };

  const getPriorityColor = (priority) => {
      switch ((priority || "").toLowerCase()) {
        case "high":
          return "FF0000";
        case "medium":
          return "FFC000";
        default:
          return "00B050";
      }
    };

    const getRiskColor = (risk) => {
      switch ((risk || "").toLowerCase()) {
        case "high":
          return "FF0000";
        case "medium":
          return "FFC000";
        default:
          return "00B050";
      }
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "333333" } },
      alignment: { horizontal: "center" },
    };

    const bordered = {
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const autoWidth = (data) => {
      return data[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...data.map(row => (row[colIndex] ? row[colIndex].toString().length : 10))
        );

        return { wch: Math.min(maxLength + 2, 50) }; // límite para no romper layout
      });
    };

    const exportToExcel = (response) => {
      if (!response) return;

      const date = new Date().toISOString().split("T")[0];
      const fileName = `QA_${response.feature_type || "feature"}_${date}.xlsx`;

      const wb = XLSX.utils.book_new();

      // 🟢 TEST CASES
      const testData = [
      ["ID", "Title", "Steps", "Expected Result", "Priority"],
      ...(response.test_cases || []).map((tc, i) => [
        `TC-${i + 1}`,
        tc.title || "",
        (tc.steps || []).join(" → "),
        tc.expected_result || "",
        (tc.priority || "").toUpperCase(),
      ]),
      ];  

      const ws1 = XLSX.utils.aoa_to_sheet(testData);
      ws1["!cols"] = autoWidth(testData);

      // estilos
      testData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

          if (!ws1[cellRef]) return;

          ws1[cellRef].s = {
            ...bordered,
            ...(rowIndex === 0
              ? headerStyle
              : colIndex === 4
              ? {
                  fill: {
                    fgColor: {
                      rgb: getPriorityColor(cell),
                    },
                  },
                }
              : {}),
          };
        });
      });

      // 🔴 RISKS
      const riskData = [
      ["ID", "Type", "Description", "Risk Level"],
      ...(response.risks || []).map((r, i) => [
        `R-${i + 1}`,
        r.type || "",
        r.description || "",
        (r.risk_level || "").toUpperCase(),
      ]),
    ];

      const ws2 = XLSX.utils.aoa_to_sheet(riskData);
      ws2["!cols"] = autoWidth(riskData);
      
      riskData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

          if (!ws2[cellRef]) return;

          ws2[cellRef].s = {
            ...bordered,
            ...(rowIndex === 0
              ? headerStyle
              : colIndex === 3
              ? {
                  fill: {
                    fgColor: {
                      rgb: getRiskColor(cell),
                    },
                  },
                }
              : {}),
          };
        });
      });

      // 🔵 SUMMARY
      const summaryData = [
        ["Field", "Value"],
        ["User Story", response.user_story],
        ["Feature Type", response.feature_type],
        ["Generated At", new Date().toLocaleString()],
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(summaryData);
      ws3["!cols"] = autoWidth(summaryData);

      summaryData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });

          if (!ws3[cellRef]) return;

          ws3[cellRef].s = {
            ...bordered,
            ...(rowIndex === 0 ? headerStyle : {}),
          };
        });
      });

      XLSX.utils.book_append_sheet(wb, ws1, "Test Cases");
      XLSX.utils.book_append_sheet(wb, ws2, "Risks");
      XLSX.utils.book_append_sheet(wb, ws3, "Summary");

      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);
    };

  return (
    
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <h1 className="text-2xl font-bold">AI QA Assistant</h1>

        {/* INPUT BOX */}
        <div className="bg-white p-4 rounded-2xl shadow space-y-4">

          <div className="flex gap-3 items-center">
            <select
              className="p-2 border rounded-lg"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option value="general">General</option>
              <option value="fintech">Fintech</option>
              <option value="ecommerce">E-commerce</option>
              <option value="saas">SaaS</option>
            </select>

            {/* ANALYZE BUTTON */}
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

            {/* EXPORT BUTTON */}
            <button
              onClick={() => exportToExcel(response)}
              disabled={!response?.test_cases}
              className="bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Export QA (Excel)
            </button>

            

          </div>

          <textarea
            className="w-full p-3 border rounded-lg"
            rows={4}
            placeholder="Enter your user story..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* RESPONSE */}
        {response && !response.error && (
          <div className="space-y-4">

            {/* FEATURE TYPE */}
            {response.feature_type && (
              <div className="bg-blue-100 p-3 rounded-lg">
                <b className="uppercase text-sm text-gray-600">
                  Feature Type:
                </b>{" "}
                {response.feature_type}
              </div>
            )}

            {/* USER STORY */}
            {response.user_story && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-semibold">User Story</h2>
                <p>{response.user_story}</p>
              </div>
            )}

            {/* RISKS */}
            {response.risks && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-semibold mb-2">Risks</h2>

                <ul className="space-y-2">
                  {response.risks.map((r, i) => {
                    const level = r.risk_level?.toLowerCase();
                    const riskColors = {
                      high: "bg-red-100 text-red-700",
                      medium: "bg-yellow-100 text-yellow-700",
                      low: "bg-green-100 text-green-700",
                    };
                    return (
                        <li
                          key={i}
                          className={`p-2 rounded-lg ${riskColors[level] || "bg-gray-100"}`}
                        >
                        <b className="uppercase mr-2">
                          {level}
                        </b>
                        {r.description}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* TEST CASES TABLE */}
            {response.test_cases && (
              <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                <h2 className="font-semibold mb-3">Test Cases</h2>

                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Title</th>
                      <th className="border p-2 text-left">Steps</th>
                      <th className="border p-2 text-left">Expected</th>
                      <th className="border p-2 text-left">Priority</th>
                    </tr>
                  </thead>

                  <tbody>
                    {response.test_cases.map((tc, i) => (
                      <tr key={i}>
                        <td className="border p-2 font-medium">
                          {tc.title}
                        </td>

                        <td className="border p-2">
                          <ul className="list-disc ml-4">
                            {tc.steps.map((s, j) => (
                              <li key={j}>{s}</li>
                            ))}
                          </ul>
                        </td>

                        <td className="border p-2">
                          {tc.expected_result}
                        </td>

                        <td className="border p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              tc.priority === "high"
                                ? "bg-red-200 text-red-800"
                                : tc.priority === "medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-green-200 text-green-800"
                            }`}
                          >
                            {tc.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* HISTORICO */}
            <button
              onClick={() => window.open("/history", "_blank")}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Abrir Dashboard
            </button>
            
          {/* HISTORICO */}
          {showHistory && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Histórico</h2>

              {history.length === 0 ? (
                <p>No hay datos aún</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 mb-3 shadow-sm bg-white"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {item.feature_type?.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 text-sm">
                      {item.user_story}
                    </div>

                    <div className="flex gap-4 mt-3 text-sm">
                      <span>🧪 Tests: {item.metrics.test_count}</span>
                      <span>⚠️ Riesgos: {item.metrics.risk_count}</span>
                      <span className="text-red-600 font-semibold">
                        🔥 High: {item.metrics.high_risk}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
          
        )}
        
        
        {/* ERROR */}
        {response?.error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">
            {response.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;