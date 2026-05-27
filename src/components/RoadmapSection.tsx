"use client";

import { useState } from "react";
import { WBSItem, Status } from "@/lib/notion";

const CATEGORY_PALETTE = [
  "#3b82f6", "#22c55e", "#a855f7", "#f97316",
  "#ec4899", "#06b6d4", "#eab308", "#ef4444", "#6366f1",
];

const STATUS_BAR_COLOR: Record<Status, string | null> = {
  "완료": "#22c55e",
  "진행중": "#f59e0b",
  "예정": null,
};

const STATUS_BADGE_CLS: Record<Status, string> = {
  "완료": "bg-green-500/15 text-green-400 border-green-500/30",
  "진행중": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "예정": "bg-slate-700/50 text-slate-400 border-slate-600/30",
};

interface CategoryGroup {
  name: string;
  color: string;
  dateStart: Date;
  dateEnd: Date;
  totalCount: number;
  scheduledCount: number;
  aggregateStatus: Status;
  subItems: WBSItem[];
}

interface Props {
  items: WBSItem[];
  showFromToday?: boolean;
}

function getCategoryOrder(name: string): number {
  const match = name.match(/^(\d+)\./);
  return match ? parseInt(match[1]) : Infinity;
}

function getAggregateStatus(items: WBSItem[]): Status {
  if (!items.length) return "예정";
  if (items.every(i => i.status === "완료")) return "완료";
  if (items.some(i => i.status === "진행중")) return "진행중";
  return "예정";
}

function calcBar(start: Date, end: Date, yearStart: Date, totalDays: number) {
  const clipped = start < yearStart ? yearStart : start;
  const leftDays = (clipped.getTime() - yearStart.getTime()) / 86400000;
  const widthDays = Math.max(1, (end.getTime() - clipped.getTime()) / 86400000 + 1);
  return {
    left: Math.max(0, (leftDays / totalDays) * 100),
    width: Math.min(100, Math.max(0.3, (widthDays / totalDays) * 100)),
  };
}

export function RoadmapSection({ items, showFromToday = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showPast, setShowPast] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const YEAR = today.getFullYear();
  const yearStart = new Date(YEAR, 0, 1);
  const yearEnd = new Date(YEAR, 11, 31);
  const totalDays = (yearEnd.getTime() - yearStart.getTime()) / 86400000 + 1;

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`,
    w: (new Date(YEAR, i + 1, 0).getDate() / totalDays) * 100,
  }));

  const todayPct = ((today.getTime() - yearStart.getTime()) / 86400000 / totalDays) * 100;

  const allCategories = [...new Set(items.map(i => i.category).filter(Boolean) as string[])];

  const groups: CategoryGroup[] = allCategories
    .map((cat, i) => {
      const catItems = items.filter(item => item.category === cat);
      const inYear = catItems.filter(item => {
        if (!item.dateStart) return false;
        const s = new Date(item.dateStart);
        const e = new Date(item.dateEnd ?? item.dateStart);
        return s <= yearEnd && e >= yearStart;
      });

      if (!inYear.length) return null;

      const starts = inYear.map(item => new Date(item.dateStart!).getTime());
      const ends = inYear.map(item => new Date(item.dateEnd ?? item.dateStart!).getTime());
      const dateEnd = new Date(Math.max(...ends));

      // 한 달 전 이전에 끝난 항목은 기본적으로 숨김 (showPast 토글로 표시)
      if (!showPast && dateEnd < lastMonthStart) return null;

      return {
        name: cat,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        dateStart: new Date(Math.min(...starts)),
        dateEnd,
        totalCount: catItems.length,
        scheduledCount: inYear.length,
        aggregateStatus: getAggregateStatus(inYear),
        subItems: inYear.sort((a, b) => a.name.localeCompare(b.name, "ko")),
      };
    })
    .filter((g): g is CategoryGroup => g !== null)
    .sort((a, b) => getCategoryOrder(a.name) - getCategoryOrder(b.name));

  if (!groups.length) {
    return <p className="text-slate-500 text-sm">표시할 일정이 없습니다.</p>;
  }

  const toggle = (name: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const Dividers = () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="flex h-full">
        {months.map((m, i) => (
          <div key={i} className="h-full border-l border-slate-800" style={{ width: `${m.w}%` }} />
        ))}
      </div>
      {/* 오늘 기준선 */}
      <div
        className="absolute top-0 bottom-0 w-px bg-blue-400/40"
        style={{ left: `${todayPct}%` }}
      />
    </div>
  );

  const hiddenCount = allCategories.filter(cat => {
    const inYear = items.filter(i => i.category === cat && i.dateStart).filter(i => {
      const e = new Date(i.dateEnd ?? i.dateStart!);
      return e >= new Date(YEAR, 0, 1) && e < lastMonthStart;
    });
    return inYear.length > 0;
  }).length;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* 지난 항목 토글 */}
        {hiddenCount > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setShowPast(v => !v)}
              className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded px-2.5 py-1 transition-colors"
            >
              {showPast ? "▲ 지난 항목 접기" : `▼ 지난 항목 보기 (${hiddenCount}개)`}
            </button>
          </div>
        )}
        {/* 월 헤더 */}
        <div className="flex mb-1">
          <div className="w-80 shrink-0" />
          <div className="flex-1 relative">
            <div className="flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-400 text-center border-l border-slate-700 pb-1.5"
                  style={{ width: `${m.w}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            {/* 헤더 오늘 마커 */}
            <div
              className="absolute top-0 w-px h-full bg-blue-400/40 pointer-events-none"
              style={{ left: `${todayPct}%` }}
            />
          </div>
        </div>

        {/* 카테고리 + 하위 항목 */}
        <div className="border-t border-slate-800">
          {groups.map(group => {
            const isOpen = expanded.has(group.name);
            const bar = calcBar(group.dateStart, group.dateEnd, yearStart, totalDays);

            return (
              <div key={group.name}>
                {/* 카테고리 행 */}
                <div
                  className="flex items-center h-11 hover:bg-slate-800/30 border-b border-slate-800/50 cursor-pointer group select-none"
                  onClick={() => toggle(group.name)}
                >
                  <div className="w-80 shrink-0 pr-4 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] w-3 shrink-0">{isOpen ? "▼" : "▶"}</span>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                      <span className="text-sm text-slate-200 truncate">{group.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${STATUS_BADGE_CLS[group.aggregateStatus]}`}>
                        {group.aggregateStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 ml-5 mt-0.5">
                      {group.totalCount}개 작업 · 일정 {group.scheduledCount}개
                    </div>
                  </div>
                  <div className="flex-1 relative h-7">
                    <Dividers />
                    <div
                      className="absolute top-1.5 h-4 rounded opacity-75 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${bar.left}%`, width: `${bar.width}%`, backgroundColor: group.color }}
                    />
                  </div>
                </div>

                {/* 하위 항목 (확장 시) */}
                {isOpen && (() => {
                  const leveled = group.subItems.filter(i => i.level > 0);
                  const display = leveled.length > 0
                    ? group.subItems.filter(i => i.level === Math.min(...leveled.map(i => i.level)))
                    : group.subItems;
                  return display.map(item => {
                    const s = new Date(item.dateStart!);
                    const e = new Date(item.dateEnd ?? item.dateStart!);
                    const sub = calcBar(s, e, yearStart, totalDays);
                    const barColor = STATUS_BAR_COLOR[item.status] ?? group.color;
                    return (
                      <div key={item.id} className="flex items-center h-8 bg-slate-900/60 border-b border-slate-800/30">
                        <div className="w-80 shrink-0 pr-4 pl-9 flex items-center gap-2">
                          <span className="text-xs text-slate-400 truncate flex-1">{item.name}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded border shrink-0 ${STATUS_BADGE_CLS[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex-1 relative h-6">
                          <Dividers />
                          <div
                            className="absolute top-1 h-3.5 rounded-sm opacity-75"
                            style={{ left: `${sub.left}%`, width: `${sub.width}%`, backgroundColor: barColor }}
                            title={`${item.dateStart} ~ ${item.dateEnd ?? item.dateStart}`}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
