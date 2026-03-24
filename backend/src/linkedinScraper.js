import axios from "axios";
import * as cheerio from "cheerio";
import { logInfo, logWarn } from "./logger.js";

function buildSearchUrl(keyword, config, start = 0, companyId = "") {
  const url = new URL(
    "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
  );
  url.searchParams.set("keywords", keyword);
  url.searchParams.set("location", config.searchLocation);
  url.searchParams.set("geoId", config.searchGeoId);
  url.searchParams.set("lang", config.searchLanguage);

  // Prioridade: companyId passado explicitamente > config.searchCompany global
  const resolvedCompany = companyId || config.searchCompany || "";
  url.searchParams.set("f_C", resolvedCompany);

  // f_WT=2 = remoto; f_WT=3 = hibrido; f_WT=1 = presencial
  url.searchParams.set("f_WT", "2");

  if (config.jobTypes) {
    url.searchParams.set("f_JT", config.jobTypes);
  }
  if (config.timeFilter) {
    url.searchParams.set("f_TPR", config.timeFilter);
  }
  url.searchParams.set("start", String(start));

  return url.toString();
}

async function fetchJobsChunk(keyword, config, start, companyId = "") {
  const url = buildSearchUrl(keyword, config, start, companyId);

  const response = await axios.get(url, {
    timeout: config.pageTimeoutMs,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const $ = cheerio.load(response.data);
  const jobs = [];

  $(".base-card, .job-search-card").each((_, card) => {
    const node = $(card);

    const titulo =
      node.find(".base-search-card__title").text().trim() ||
      node.find("h3").first().text().trim() ||
      "";

    const empresa =
      node.find(".base-search-card__subtitle").text().trim() ||
      node.find("h4").first().text().trim() ||
      "";

    const local = node.find(".job-search-card__location").text().trim() || "";

    const link =
      node.find("a.base-card__full-link").attr("href") ||
      node.find("a[href*='/jobs/view/']").attr("href") ||
      "";

    jobs.push({ titulo, empresa, local, link });
  });

  return jobs;
}

function normalizeJob(job) {
  return {
    titulo:  job.titulo?.trim()  || "",
    empresa: job.empresa?.trim() || "",
    local:   job.local?.trim()   || "",
    link:    job.link?.trim()    || "",
  };
}

function dedupeJobs(jobs) {
  const unique = new Map();

  for (const job of jobs) {
    const key = job.link || `${job.titulo}-${job.empresa}-${job.local}`;
    if (!key || unique.has(key)) continue;
    unique.set(key, job);
  }

  return [...unique.values()];
}

/**
 * Busca todas as vagas para uma keyword+empresa específica, paginando até o limite.
 * Retorna os jobs já normalizados e anotados com { palavra, empresaId }.
 */
async function scrapeForTarget(keyword, companyId = "", config) {
  const maxPagesPerKeyword = config.maxPagesPerKeyword || 5;
  const pageStep = 25;
  const collected = [];
  const label = companyId ? `"${keyword}" (empresa: ${companyId})` : `"${keyword}"`;

  logInfo(`Buscando vagas para: ${label}`);

  for (let pageIndex = 0; pageIndex < maxPagesPerKeyword; pageIndex++) {
    const start = pageIndex * pageStep;
    let jobs = [];

    try {
      jobs = await fetchJobsChunk(keyword, config, start, companyId);
    } catch {
      logWarn(`Falha HTTP na busca para: ${label} (start=${start})`);
    }

    if (jobs.length === 0) {
      if (pageIndex === 0) {
        logWarn(`Elementos de vaga não encontrados para: ${label}`);
      }
      break;
    }

    const normalized = jobs.map(normalizeJob);

    collected.push(
      ...normalized.map((job) => ({
        palavra:    keyword,
        empresaId:  companyId || "",
        ...job,
      }))
    );

    await new Promise((resolve) =>
      setTimeout(resolve, config.waitBetweenSearchesMs)
    );
  }

  logInfo(`${collected.length} vagas encontradas para: ${label}`);
  return collected;
}

/**
 * Monta a lista completa de alvos de busca combinando:
 *  1. Todas as keywords genéricas (sem empresa).
 *  2. Cada keyword presente em keywordsWithCompanyId × cada company ID associado.
 *
 * Exemplo de saída:
 *  [
 *    { keyword: "Java",       companyId: ""     },  // busca geral
 *    { keyword: "JavaScript", companyId: ""     },  // busca geral
 *    { keyword: "Java",       companyId: "1441" },  // Google
 *    { keyword: "Java",       companyId: "1035" },  // Microsoft
 *    ...
 *  ]
 */
function buildSearchTargets(config) {
  const targets = [];

  // 1. Buscas genéricas — todas as keywords sem filtro de empresa
  for (const keyword of config.keywords) {
    targets.push({ keyword, companyId: "" });
  }

  // 2. Buscas direcionadas — keyword × empresa
  const map = config.keywordsWithCompanyId || {};
  for (const [keyword, companyIds] of Object.entries(map)) {
    for (const companyId of companyIds) {
      targets.push({ keyword, companyId });
    }
  }

  return targets;
}

export async function scrapeLinkedinJobs(config) {
  const allJobs = [];
  const targets = buildSearchTargets(config);

  logInfo(
    `Total de buscas planejadas: ${targets.length} ` +
      `(${config.keywords.length} genéricas + ` +
      `${targets.length - config.keywords.length} direcionadas por empresa)`
  );

  for (const { keyword, companyId } of targets) {
    const jobs = await scrapeForTarget(keyword, companyId, config);
    allJobs.push(...jobs);
  }

  const deduped = dedupeJobs(allJobs);
  logInfo(`Total após deduplicação: ${deduped.length} vagas`);

  return deduped;
}