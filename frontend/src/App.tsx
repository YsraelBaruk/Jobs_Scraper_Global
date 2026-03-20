import { useCallback, useEffect, useMemo, useState } from "react";
import { JobsFiltersCard } from "@/components/JobsFiltersCard";
import { JobsHeaderCard } from "@/components/JobsHeaderCard";
import { JobsTableCard } from "@/components/JobsTableCard";
import { fetchJobFiles, fetchJobsByFile } from "@/services/jobsService";
import type { Job, JobFile, JobsMeta } from "@/types/jobs";

function formatDate(timestamp: JobsMeta["modifiedAt"]): string {
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("pt-BR");
}

function App() {
  const [files, setFiles] = useState<JobFile[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [search, setSearch] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<JobsMeta>({ file: "", modifiedAt: null, total: 0 });
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

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  }, [filteredJobs.length, pageSize]);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  const loadJobs = useCallback(async (fileName: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJobsByFile(fileName);
      setJobs(data.jobs);
      setMeta({
        file: data.file,
        modifiedAt: data.modifiedAt,
        total: data.total,
      });
      setSelectedFile(data.file || fileName || "");
    } catch (err: unknown) {
      setJobs([]);
      setMeta({ file: "", modifiedAt: null, total: 0 });
      setError(err instanceof Error ? err.message : "Erro inesperado ao carregar vagas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initializeFiles() {
      const foundFiles = await fetchJobFiles();
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
  }, [selectedFile, loadJobs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, keywordFilter, selectedFile, pageSize]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

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
          paginatedJobs={paginatedJobs}
          jobs={jobs}
          loading={loading}
          error={error}
          formatDate={formatDate}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>
    </main>
  );
}

export default App;
