/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";

/**
 * Transforma dados e faz o download direto no browser (Client-side)
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName = "Planilha1",
) {
  // 1. Cria a worksheet a partir dos dados JSON
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Cria o workbook (arquivo excel)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 3. Dispara o download no navegador
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Caso precise gerar o buffer para enviar por API/Server Action
 */
export function generateExcelBuffer(
  data: Record<string, any>[],
  sheetName = "Planilha1",
): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
