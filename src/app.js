import { openBrowser } from "./browser.js";
import { getConfig } from "./config.js";
import { exportToExcel, exportToPDF } from "./exporter.js";
import { scrapeLinkedinJobs } from "./linkedinScraper.js";
import { logInfo } from "./logger.js";

export async function run() {
  const config = getConfig();
  const browser = await openBrowser(config);

  try {
    const page = await browser.newPage();
    await page.setViewport(config.viewport);

    logInfo(`Localizacao da busca: ${config.searchLocation}`);
    logInfo(`Total de palavras-chave: ${config.keywords.length}`);

    const jobs = await scrapeLinkedinJobs(page, config);
    exportToExcel(jobs, config.outputFile);
    await exportToPDF(jobs, config.pdfFile);

    logInfo(`Total de vagas unicas exportadas: ${jobs.length}`);
  } finally {
    await browser.close();
  }
}
