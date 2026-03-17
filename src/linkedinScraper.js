import { logInfo, logWarn } from "./logger.js";

function buildSearchUrl(keyword, config) {
  const url = new URL("https://www.linkedin.com/jobs/search/");
  url.searchParams.set("keywords", keyword);
  url.searchParams.set("location", config.searchLocation);
  url.searchParams.set("lang", config.searchLanguage);
  return url.toString();
}

function normalizeJob(job) {
  return {
    titulo: job.titulo?.trim() || "",
    empresa: job.empresa?.trim() || "",
    local: job.local?.trim() || "",
    link: job.link?.trim() || ""
  };
}

function dedupeJobs(jobs) {
  const unique = new Map();

  for (const job of jobs) {
    const key = job.link || `${job.titulo}-${job.empresa}-${job.local}`;
    if (!key || unique.has(key)) {
      continue;
    }
    unique.set(key, job);
  }

  return [...unique.values()];
}

export async function scrapeLinkedinJobs(page, config) {
  const allJobs = [];

  for (const keyword of config.keywords) {
    logInfo(`Buscando vagas para: ${keyword}`);

    const url = buildSearchUrl(keyword, config);
    await page.goto(url, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, config.waitBetweenSearchesMs));

    try {
      await page.waitForSelector(".job-search-card", { timeout: config.pageTimeoutMs });
    } catch {
      logWarn(`Elementos de vaga nao encontrados para: ${keyword}`);
    }

    const jobs = await page
      .$$eval(".job-search-card", (items) =>
        items.map((jobCard) => {
          const titulo =
            jobCard.querySelector("h3.base-search-card__title")?.innerText?.trim() ||
            jobCard
              .querySelector("a[data-tracking-control-name='public_jobs_jserp-result_search-card']")
              ?.innerText?.trim() ||
            "";

          const empresa =
            jobCard.querySelector("h4.base-search-card__subtitle")?.innerText?.trim() ||
            jobCard
              .querySelector(
                "a[data-tracking-control-name='public_jobs_jserp-result_job-search-card-subtitle']"
              )
              ?.innerText?.trim() ||
            "";

          const local =
            jobCard.querySelector("span.job-search-card__location")?.innerText?.trim() || "";

          const link =
            jobCard.querySelector("h3.base-search-card__title a")?.href ||
            jobCard.querySelector(
              "a[data-tracking-control-name='public_jobs_jserp-result_search-card']"
            )?.href ||
            "";

          return { titulo, empresa, local, link };
        })
      )
      .catch(() => []);

    const normalized = jobs.map(normalizeJob);

    allJobs.push(
      ...normalized.map((job) => ({
        palavra: keyword,
        ...job
      }))
    );

    logInfo(`${jobs.length} vagas encontradas para: ${keyword}`);
  }

  return dedupeJobs(allJobs);
}
