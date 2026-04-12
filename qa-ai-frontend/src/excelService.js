
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export const exportToExcel = (response) => {
      if (!response) return;

      const date = new Date().toISOString().split("T")[0];
      const fileName = `QA_${response.feature_type || "feature"}_${date}.xlsx`;

      const wb = XLSX.utils.book_new();

      // 🟢 TEST CASES
      const testData = [
        ["ID", "Title", "Steps", "Expected Result", "Priority"],
        ...response.test_cases.map((tc, i) => [
          `TC-${i + 1}`,
          tc.title,
          tc.steps.join(" → "),
          tc.expected_result,
          tc.priority?.toUpperCase(),
        ]),
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(testData);

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
        ...response.risks.map((r, i) => [
          `R-${i + 1}`,
          r.type,
          r.description,
          r.risk_level?.toUpperCase(),
        ]),
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(riskData);

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