# Jobs Scraper Global

Bot de automacao para buscar vagas de tecnologia no LinkedIn em escala global e exportar os resultados para Excel.

## O que mudou

- Busca padrao agora cobre vagas no mundo todo (location=Worldwide)
- Projeto refatorado para uma arquitetura modular e manutencao facilitada
- Configuracao por variaveis de ambiente para localizacao, idioma, keywords e comportamento do navegador
- Tratamento de erro centralizado e logs com timestamp
- Deduplicacao de vagas antes da exportacao

## Arquitetura

- index.js: entrypoint enxuto e tratamento de falhas
- src/config.js: leitura e validacao de configuracoes
- src/browser.js: descoberta de Chrome/Edge e abertura do Puppeteer
- src/linkedinScraper.js: logica de busca e extracao no LinkedIn
- src/exporter.js: exportacao para Excel
- src/logger.js: logs padronizados
- src/app.js: orquestracao do fluxo completo

## Requisitos

- Node.js 22+
- Google Chrome ou Microsoft Edge instalado
- npm

## Instalacao

1. Clone o projeto
2. Execute npm install

## Execucao

- Producao: npm start
- Desenvolvimento: npm run dev
- Hot reload: npm run run

## Configuracao por ambiente

Variaveis opcionais:

- SEARCH_LOCATION: local da busca (padrao: Worldwide)
- SEARCH_LANGUAGE: idioma da busca (padrao: en)
- SEARCH_KEYWORDS: lista separada por virgula
- HEADLESS: true ou false (padrao: false)
- WAIT_BETWEEN_SEARCHES_MS: espera entre buscas (padrao: 5000)
- PAGE_TIMEOUT_MS: timeout de seletores (padrao: 10000)
- VIEWPORT_WIDTH: largura do navegador (padrao: 1280)
- VIEWPORT_HEIGHT: altura do navegador (padrao: 800)
- OUTPUT_FILE: nome do arquivo de saida (padrao: vagas_linkedin.xlsx)
- CHROME_PATH: caminho do executavel do navegador

Exemplo no Windows cmd:

set SEARCH_LOCATION=Worldwide&& set SEARCH_LANGUAGE=en&& set HEADLESS=true&& npm start

Exemplo com keywords customizadas:

set SEARCH_KEYWORDS=NodeJS,ReactJS,Python,DevOps&& npm start

## Saida

Planilha Excel com as colunas:

- palavra
- titulo
- empresa
- local
- link

Arquivo padrao: vagas_linkedin.xlsx

## Exemplo de planilha:

<img width="1901" height="599" alt="Image" src="https://github.com/user-attachments/assets/7c1c525f-1abb-438c-a398-3a44c23727fa" />

## Troubleshooting

Chrome/Edge nao encontrado:

- Instale Chrome ou Edge
- Ou informe CHROME_PATH manualmente

Exemplo:

set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe&& npm start

## Avisos

- Respeite os termos de uso do LinkedIn
- Use o scraper de forma etica e responsavel
- A estrutura de HTML do LinkedIn pode mudar e exigir ajuste de seletores
