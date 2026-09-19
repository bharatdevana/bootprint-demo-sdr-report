import { JobProgress } from "@/components/job-progress";

export default async function JobPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <JobProgress runId={runId} />;
}
