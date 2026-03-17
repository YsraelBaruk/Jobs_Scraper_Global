const DEFAULT_KEYWORDS = [
  "NodeJS",
  "JavaScript Full Stack",
  "Suporte",
  "Sustentação",
  "Mulesoft Java",
  "Java Pleno",
  "Java Senior",
  "JavaScript Senior",
  "ReactJS",
  "React Native",
  "Angular",
  "VueJS",
  "Spring Boot",
  "Project Manager",
  "Scrum Master",
  "Product Owner",
  "Analista de Sistemas",
  "Analista de Suporte",
  "Analista de Sustentação",
  "Analista de Testes",
  "QA",
  "Testes Automatizados",
  "DevOps",
  "Cloud Engineer",
  "AWS",
  "Azure",
  "Google Cloud",
  "Data Engineer",
  "Data Scientist",
  "Machine Learning",
  "Inteligencia Artificial"
];

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseKeywords(value) {
  if (!value) {
    return DEFAULT_KEYWORDS;
  }

  const keywords = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : DEFAULT_KEYWORDS;
}

export function getConfig() {
  return {
    headless: parseBoolean(process.env.HEADLESS, false),
    waitBetweenSearchesMs: parseNumber(process.env.WAIT_BETWEEN_SEARCHES_MS, 5000),
    pageTimeoutMs: parseNumber(process.env.PAGE_TIMEOUT_MS, 10000),
    viewport: {
      width: parseNumber(process.env.VIEWPORT_WIDTH, 1280),
      height: parseNumber(process.env.VIEWPORT_HEIGHT, 800)
    },
    outputFile: process.env.OUTPUT_FILE || "vagas_linkedin.xlsx",
    searchLocation: process.env.SEARCH_LOCATION || "Worldwide",
    searchLanguage: process.env.SEARCH_LANGUAGE || "en",
    keywords: parseKeywords(process.env.SEARCH_KEYWORDS)
  };
}
