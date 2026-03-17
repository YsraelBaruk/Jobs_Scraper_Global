import XLSX from "xlsx";
import { logInfo } from "./logger.js";

export function exportToExcel(rows, outputFile) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vagas");
  XLSX.writeFile(workbook, outputFile);

  logInfo(`Arquivo gerado: ${outputFile}`);
}
