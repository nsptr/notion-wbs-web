import { WBSItem } from "@/lib/notion";

export function MilestoneSection({ items }: { items: WBSItem[] }) {
  const milestones = items
    .filter(i => i.level === 1)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  if (!milestones.length) {
    return <p className="text-slate-500 text-sm">마일스톤 데이터가 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {milestones.map(item => {
        const prefix = item.name.match(/^(\d+)\./)?.[1];
        const subItems = prefix
          ? items.filter(i => i.name.match(new RegExp(`^${prefix}-`)))
          : [];
        const scheduled = subItems.filter(i => i.dateStart).length;

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{item.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                하위 작업 {subItems.length}개
                {subItems.length > 0 && (
                  <span className="ml-2 text-slate-400">· 일정 등록 {scheduled}개</span>
                )}
              </div>
            </div>
            {item.dateStart ? (
              <div className="text-xs text-slate-300 text-right shrink-0">
                <div>{item.dateStart}</div>
                {item.dateEnd && item.dateEnd !== item.dateStart && (
                  <div className="text-slate-500">~ {item.dateEnd}</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-600 shrink-0">일정 미정</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
