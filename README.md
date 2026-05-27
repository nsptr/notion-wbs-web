# 2026 WBS 대시보드

Notion WBS 데이터베이스를 연동한 연간 월별 로드맵 대시보드입니다.

## 기술 스택

- **Next.js 16** (App Router, Server Components)
- **Notion API** (`@notionhq/client`)
- **Tailwind CSS**
- **Vercel** 배포

## 주요 기능

- 2026년 1월~12월 고정 Gantt 차트
- 프로젝트(Notion DB) 단위 분리 표시
- 카테고리(화면 분류)별 그룹화 및 하위 항목 클릭 확장
- **예정 / 진행중 / 완료** 상태 자동 반영
  - Notion `상태` 필드 우선 적용
  - 필드 없을 경우 날짜 기준 자동 추론
- 오늘 기준선 표시
- 매일 자동 갱신 (Vercel ISR, `revalidate = 86400`)

## 환경 변수

`.env.local` 파일을 생성하고 아래 값을 입력하세요.

```
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_IDS=database_id_1,database_id_2
```

## 로컬 실행

```bash
npm install
npm run dev
```

## 프로젝트 설정

`src/lib/projects.config.ts` 에서 DB를 등록합니다. 대시보드 제목은 Notion DB 제목을 그대로 사용합니다.

```ts
const config = {
  "database-id-1": {},
  "database-id-2": {},
};
```
