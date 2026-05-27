import { WBSItem } from "@/lib/notion";

const COLOR_PALETTE = [
  "#3b82f6", "#22c55e", "#a855f7", "#f97316",
  "#ec4899", "#06b6d4", "#eab308", "#ef4444", "#6366f1",
];

export function StatusSection({ items }: { items: WBSItem[] }) {
  const allCategories = [...new Set(items.map(i => i.category).filter(Boolean) as string[])];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allCategories.map((category, index) => {
        const categoryItems = items.filter(i => i.category === category);
        const withDates = categoryItems.filter(i => i.dateStart);
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
        const progress = categoryItems.length > 0 ? Math.round((withDates.length / categoryItems.length) * 100) : 0;

        return (
          <div key={category} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <h3 className="text-sm font-medium text-white truncate">{category}</h3>
            </div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-3xl font-bold text-white">{categoryItems.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">전체 작업</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-slate-300">{withDates.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">일정 등록</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1.5 text-right">{progress}% 일정 입력</div>
          </div>
        );
      })}
    </div>
  );
}
