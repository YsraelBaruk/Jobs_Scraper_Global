import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Job, JobsMeta } from "@/types/jobs";

interface JobsTableCardProps {
  meta: JobsMeta;
  filteredJobs: Job[];
  jobs: Job[];
  loading: boolean;
  error: string;
  formatDate: (timestamp: JobsMeta["modifiedAt"]) => string;
}

export function JobsTableCard({ meta, filteredJobs, jobs, loading, error, formatDate }: JobsTableCardProps) {
  return (
    <Card className="border-white/30 bg-card/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">Vagas Encontradas</CardTitle>
        <CardDescription>
          Atualizado em {formatDate(meta.modifiedAt)}. Mostrando {filteredJobs.length} de {jobs.length} vagas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-md border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-900">{error}</div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Palavra-chave</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job, index) => (
              <TableRow key={`${job.link || index}-${index}`}>
                <TableCell>{job.palavra || "-"}</TableCell>
                <TableCell className="font-medium">{job.titulo || "-"}</TableCell>
                <TableCell>{job.empresa || "-"}</TableCell>
                <TableCell>{job.local || "-"}</TableCell>
                <TableCell>
                  {job.link ? (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Abrir vaga
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!loading && filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhuma vaga encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
