import { fetchAllProjects } from "@/lib/notion";
import { getProjectConfig } from "@/lib/projects.config";
import { RoadmapSection } from "@/components/RoadmapSection";

export const revalidate = 86400;

export default async function DashboardPage() {
  const projects = await fetchAllProjects();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">2026 WBS 대시보드</h1>
          <p className="text-slate-500 text-xs mt-1">월별 로드맵 · 매일 갱신</p>
        </div>

        {/* Projects */}
        <div className="space-y-10">
          {projects.map(project => {
            const config = getProjectConfig(project.id);
            return (
              <div key={project.id}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-base font-semibold text-slate-100">{config.titleOverride ?? project.title}</h2>
                  <span className="text-xs text-slate-500">
                    {project.items.length}개 작업 ·{" "}
                    {[...new Set(project.items.map(i => i.category).filter(Boolean))].length}개 분류
                  </span>
                  {config.showFromToday && (
                    <span className="text-xs text-slate-600">· 이번 달 이후</span>
                  )}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <RoadmapSection items={project.items} showFromToday={config.showFromToday} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
