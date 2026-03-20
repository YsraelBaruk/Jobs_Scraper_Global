import { useEffect, useMemo, useState } from "react";
import { JobsFiltersCard } from "@/components/JobsFiltersCard";
import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { JobsTableCard } from "@/components/JobsTableCard";

function formatDate(timestamp) {
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("pt-BR");
}

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [search, setSearch] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ file: "", modifiedAt: null, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const keywords = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => String(job.palavra || "").trim()).filter(Boolean)));
    return values.sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const byKeyword = keywordFilter === "all" || String(job.palavra || "") === keywordFilter;
      if (!byKeyword) {
        return false;
      }

      if (!term) {
        return true;
      }

      const text = [job.titulo, job.empresa, job.local, job.link, job.palavra]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return text.includes(term);
    });
  }, [jobs, search, keywordFilter]);

  async function loadJobs(fileName) {
    setLoading(true);
    setError("");
    try {
      const suffix = fileName ? `?file=${encodeURIComponent(fileName)}` : "";
      const response = await fetch(`/api/jobs${suffix}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Falha ao carregar vagas.");
      }

      setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
      setMeta({
        file: payload.file || "",
        modifiedAt: payload.modifiedAt || null,
        total: Number(payload.total || 0),
      });
      setSelectedFile(payload.file || fileName || "");
    } catch (err) {
      setJobs([]);
      setMeta({ file: "", modifiedAt: null, total: 0 });
      setError(err.message || "Erro inesperado ao carregar vagas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initializeFiles() {
      const response = await fetch("/api/jobs/files");
      const payload = await response.json();
      const foundFiles = Array.isArray(payload.files) ? payload.files : [];
      setFiles(foundFiles);
      if (foundFiles[0]?.file) {
        setSelectedFile(foundFiles[0].file);
      }
    }

    initializeFiles().catch(() => {
      setError("Nao foi possivel listar arquivos .xlsx da pasta output.");
    });
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadJobs(selectedFile);
    }
  }, [selectedFile]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(236,195,117,0.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(92,151,191,0.28),transparent_35%),radial-gradient(circle_at_50%_95%,rgba(201,120,99,0.22),transparent_40%)]" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <JobsHeaderCard meta={meta} />

        <JobsFiltersCard
          search={search}
          setSearch={setSearch}
          keywordFilter={keywordFilter}
          setKeywordFilter={setKeywordFilter}
          keywords={keywords}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          files={files}
          loading={loading}
          onRefresh={() => loadJobs(selectedFile)}
        />

        <JobsTableCard
          meta={meta}
          filteredJobs={filteredJobs}
          jobs={jobs}
          loading={loading}
          error={error}
          formatDate={formatDate}
        />
      </section>
    </main>
  );
}

export default App;
