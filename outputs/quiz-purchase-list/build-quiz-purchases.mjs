import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/annayip/Documents/ChatGPT/Quiz/outputs/quiz-purchase-list";
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Quiz listings");
sheet.showGridLines = false;

sheet.getRange("A1:F1").merge();
sheet.getRange("A1").values = [["Paid Quiz Listings — Purchase Counts"]];
sheet.getRange("A2:F2").merge();
sheet.getRange("A2").values = [["Source: supplied RedNote product-search screenshot. Counts are the seller-displayed totals, not independently verified transactions."]];

const headers = [[
  "Quiz listing (Chinese)",
  "Quiz type / theme",
  "Displayed total sales",
  "Numeric lower bound",
  "Displayed price",
  "Recent activity shown"
]];
const rows = [
  ["SCL-90 心理测试量表", "Mental-health symptom checklist", "1.7万+", 17000, "¥0.99", "24 hours: 200+ people purchased"],
  ["天赋测评 + 职业测评", "Talent and career direction", "1.6万+", 16000, "¥5.99", "24 hours: 200+ people purchased"],
  ["七宗罪分布测试（全新）", "Seven Deadly Sins personality", "4.5万+", 45000, "Coupon price ¥1.99", "Repeat customers: 200+"],
  ["七宗罪 VS 七美德", "Seven Sins vs. Seven Virtues personality", "1.1万+", 11000, "Coupon price ¥0.99", "7 days: 7,000+ people"],
];
sheet.getRange("A4:F4").values = headers;
sheet.getRange("A5:F8").values = rows;
sheet.getRange("A10:F10").merge();
sheet.getRange("A10").values = [["Interpretation note: “万+” means ten-thousand-plus; numeric lower bounds preserve that minimum rather than estimating exact sales."]];

sheet.getRange("A1:F1").format = {
  fill: "#FFFFFF",
  font: { bold: true, size: 16, color: "#202124" },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
sheet.getRange("A2:F2").format = {
  font: { italic: true, color: "#5F6368", size: 10 },
  wrapText: true,
  verticalAlignment: "center",
};
sheet.getRange("A4:F4").format = {
  fill: "#F1F3F4",
  font: { bold: true, color: "#202124" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#DADCE0" },
};
sheet.getRange("A5:F8").format = {
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "inside", style: "thin", color: "#E8EAED" },
};
sheet.getRange("C5:C8").format.horizontalAlignment = "right";
sheet.getRange("D5:D8").format = { horizontalAlignment: "right", numberFormat: "#,##0" };
sheet.getRange("A10:F10").format = {
  font: { italic: true, color: "#5F6368", size: 10 },
  wrapText: true,
  verticalAlignment: "center",
};
sheet.getRange("A1:F1").format.rowHeightPx = 30;
sheet.getRange("A2:F2").format.rowHeightPx = 36;
sheet.getRange("A4:F4").format.rowHeightPx = 28;
sheet.getRange("A5:F8").format.rowHeightPx = 40;
sheet.getRange("A10:F10").format.rowHeightPx = 34;
sheet.getRange("A:A").format.columnWidthPx = 205;
sheet.getRange("B:B").format.columnWidthPx = 210;
sheet.getRange("C:C").format.columnWidthPx = 125;
sheet.getRange("D:D").format.columnWidthPx = 130;
sheet.getRange("E:E").format.columnWidthPx = 115;
sheet.getRange("F:F").format.columnWidthPx = 220;
sheet.freezePanes.freezeRows(4);
sheet.tables.add("A4:F8", true, "QuizPurchaseListings");

const inspect = await workbook.inspect({
  kind: "table",
  range: "Quiz listings!A1:F10",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
const preview = await workbook.render({ sheetName: "Quiz listings", range: "A1:F10", scale: 2 });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/quiz-purchase-listings.xlsx`);
