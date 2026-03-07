import { AdminStats } from "@/components/AdminStats";
import { QueriesTable } from "@/components/QueriesTable";
import { KnowledgeGaps } from "@/components/KnowledgeGaps";
import { ChunkStats } from "@/components/ChunkStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-[#f7f7f7]">
      <div className="container py-12 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedForeground">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">AskBase Analytics</h1>
          <p className="text-sm text-mutedForeground">
            Quick visibility into usage, feedback, and recent questions.
          </p>
        </div>
        <AdminStats />
        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <QueriesTable />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeGaps />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chunk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ChunkStats />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
