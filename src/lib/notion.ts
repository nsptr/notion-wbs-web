import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

export type Status = "완료" | "진행중" | "예정";

export interface WBSItem {
  id: string;
  name: string;
  category: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  level: number;
  status: Status;
}

export interface Project {
  id: string;
  title: string;
  items: WBSItem[];
}

function findTitleProp(properties: Record<string, any>): string | null {
  const entry = Object.entries(properties).find(([, v]) => v.type === "title");
  return entry?.[1]?.title?.[0]?.plain_text ?? null;
}

function findCategoryProp(properties: Record<string, any>): string | null {
  for (const name of ["화면 분류", "분류", "카테고리", "category"]) {
    if (properties[name]?.type === "select") {
      return properties[name].select?.name ?? null;
    }
  }
  return null;
}

function findDateProp(properties: Record<string, any>): { start: string | null; end: string | null } {
  for (const name of ["일정", "계획 및 완료일", "date"]) {
    if (properties[name]?.type === "date" && properties[name]?.date?.start) {
      return { start: properties[name].date.start, end: properties[name].date.end ?? null };
    }
  }
  return { start: null, end: null };
}

function findRawStatus(properties: Record<string, any>): string | null {
  for (const name of ["상태", "status", "Status"]) {
    const prop = properties[name];
    if (prop?.type === "multi_select" && prop.multi_select?.length > 0) {
      return prop.multi_select.map((s: any) => s.name).join(",");
    }
    if (prop?.type === "select" && prop.select?.name) {
      return prop.select.name;
    }
  }
  return null;
}

function normalizeStatus(raw: string | null, dateStart: string | null, dateEnd: string | null): Status {
  if (raw) {
    if (/완료|done|complete|finished/i.test(raw)) return "완료";
    if (/진행|progress|doing|active/i.test(raw)) return "진행중";
  }
  if (!dateStart) return "예정";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(dateStart);
  const end = new Date(dateEnd ?? dateStart);
  if (today > end) return "완료";
  if (today >= start) return "진행중";
  return "예정";
}

async function fetchItems(databaseId: string): Promise<WBSItem[]> {
  const allResults: any[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
    });
    allResults.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return allResults.map((page: any) => {
    const name = findTitleProp(page.properties) ?? "";
    const match = name.match(/^(\d+(?:-\d+)*)\./);
    const level = match ? match[1].split("-").length : 0;
    const date = findDateProp(page.properties);
    const raw = findRawStatus(page.properties);
    return {
      id: page.id,
      name,
      category: findCategoryProp(page.properties),
      dateStart: date.start,
      dateEnd: date.end,
      level,
      status: normalizeStatus(raw, date.start, date.end),
    };
  });
}

async function fetchProject(databaseId: string): Promise<Project> {
  const [db, items] = await Promise.all([
    notion.databases.retrieve({ database_id: databaseId }),
    fetchItems(databaseId),
  ]);
  const title = (db as any).title?.[0]?.plain_text ?? "프로젝트";
  return { id: databaseId, title, items };
}

export async function fetchAllProjects(): Promise<Project[]> {
  const ids = (process.env.NOTION_DATABASE_IDS ?? process.env.NOTION_DATABASE_ID ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return Promise.all(ids.map(fetchProject));
}
