import ExcelJS from "exceljs";
import {
  createExportViewModel,
  normalizeKitForExport,
  type ExportSafeKit,
} from "./exportModel.js";

type KitPayload = {
  id: string;
  brief_json: unknown;
  result_json: unknown;
  created_at: unknown;
};

const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D4ED8" },
} as const;

const HEADER_FONT = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  name: "Calibri",
  size: 11,
} as const;

function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = HEADER_FONT;
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 24;
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
}

function getCellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  return "";
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function applyDataWrap(worksheet: ExcelJS.Worksheet, startRow = 2) {
  for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    let maxTextLength = 0;
    row.eachCell((cell) => {
      const text = getCellText(cell.value);
      maxTextLength = Math.max(maxTextLength, text.length);
      const isArabic = containsArabic(text);
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      cell.alignment = {
        vertical: "top",
        horizontal: isArabic ? "right" : "left",
        readingOrder: isArabic ? "rtl" : "ltr",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC" },
      };
    });
    row.height = Math.min(180, Math.max(22, Math.ceil(maxTextLength / 80) * 18));
  }
}

export function sanitizeKitForExcel(kit: KitPayload): ExportSafeKit {
  return normalizeKitForExport(kit);
}

export async function generateKitExcel(kit: KitPayload): Promise<Buffer> {
  const normalized = sanitizeKitForExcel(kit);
  const model = createExportViewModel(normalized);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ai-content-dashboard";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summary = workbook.addWorksheet("Summary", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });
  summary.columns = [
    { header: "Field", key: "field", width: 28 },
    { header: "Value", key: "value", width: 72 },
  ];
  applyHeaderStyle(summary.getRow(1));
  summary.autoFilter = "A1:B1";
  summary.addRows([
    { field: "Brand", value: model.brandName },
    { field: "Kit ID", value: model.id },
    { field: "Created At", value: model.createdAt },
    { field: "Narrative Summary", value: model.narrativeSummary || "-" },
    {
      field: "Diagnosis Plan",
      value:
        model.diagnosisPlan.length > 0
          ? model.diagnosisPlan.map((item) => `${item.label}: ${item.value}`).join("\n")
          : "-",
    },
  ]);
  applyDataWrap(summary);

  const postsSheet = workbook.addWorksheet("Posts", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });
  postsSheet.columns = [
    { header: "Platform", key: "platform", width: 16 },
    { header: "Format", key: "format", width: 14 },
    { header: "Goal", key: "goal", width: 28 },
    { header: "Caption", key: "caption", width: 72 },
    { header: "Hashtags", key: "hashtags", width: 38 },
    { header: "CTA", key: "cta", width: 40 },
  ];
  applyHeaderStyle(postsSheet.getRow(1));
  postsSheet.autoFilter = "A1:F1";
  if (model.posts.length > 0) {
    postsSheet.addRows(
      model.posts.map((item) => ({
        platform: item.platform,
        format: item.format,
        goal: item.goal,
        caption: item.caption,
        hashtags: item.hashtags.map((tag) => `#${tag}`).join(" "),
        cta: item.cta,
      }))
    );
  } else {
    postsSheet.addRow({ platform: "-", format: "-", goal: "-", caption: "No posts", hashtags: "-", cta: "-" });
  }
  applyDataWrap(postsSheet);

  const imageSheet = workbook.addWorksheet("ImageDesigns", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });
  imageSheet.columns = [
    { header: "Platform Format", key: "platformFormat", width: 24 },
    { header: "Design Type", key: "designType", width: 20 },
    { header: "Goal", key: "goal", width: 28 },
    { header: "Caption", key: "caption", width: 72 },
    { header: "Supporting Copy", key: "supportingCopy", width: 72 },
  ];
  applyHeaderStyle(imageSheet.getRow(1));
  imageSheet.autoFilter = "A1:E1";
  if (model.imageDesigns.length > 0) {
    imageSheet.addRows(model.imageDesigns);
  } else {
    imageSheet.addRow({
      platformFormat: "-",
      designType: "-",
      goal: "-",
      caption: "No image designs",
      supportingCopy: "-",
    });
  }
  applyDataWrap(imageSheet);

  const uint8 = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8);
}
