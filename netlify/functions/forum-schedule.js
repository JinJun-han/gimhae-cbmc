// Netlify Serverless Function — Notion DB → 포럼 일정 JSON
// 환경변수: NOTION_API_KEY, NOTION_FORUM_DB_ID
// 전략: Notion API 먼저 시도 → 실패 시 정적 데이터 폴백

// 2026-02-21 MCP에서 가져온 실제 Notion DB 데이터
const FALLBACK_DATA = [
  {
    id: "310edb42-7c02-8158-a142-c3afe0f47db1",
    title: "조찬주회 — 서재찬 박사",
    date: "2026-03-07",
    speaker: "서재찬 박사 (반석인더스트리즈 대표)",
    scripture: "",
    status: "예정",
    category: "조찬주회",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: ""
  },
  {
    id: "310edb42-7c02-81fd-9e1b-e9fe0b66d67f",
    title: "조찬주회 — 임성택 한의학박사",
    date: "2026-02-28",
    speaker: "임성택 한의학박사 (자연힐 한방병원 병원장)",
    scripture: "",
    status: "예정",
    category: "조찬주회",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: "건강과 비즈니스"
  },
  {
    id: "30dedb42-7c02-8113-b6a2-cf701609ffa4",
    title: "조찬주회 — 서재찬 박사",
    date: "2026-02-07",
    speaker: "서재찬 박사 (반석인더스트리즈 대표)",
    scripture: "",
    status: "완료",
    category: "조찬주회",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: ""
  }
];

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=600"
};

export default async (req) => {
  const NOTION_KEY = Netlify.env.get("NOTION_API_KEY");
  const DB_ID = Netlify.env.get("NOTION_FORUM_DB_ID") || "5c8ac416-3703-42d5-bb1a-ca632c8db7d8";

  // Notion API가 설정되어 있으면 먼저 시도
  if (NOTION_KEY) {
    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sorts: [{ property: "날짜", direction: "descending" }],
          page_size: 20
        })
      });

      if (res.ok) {
        const data = await res.json();
        const items = data.results.map(page => {
          const p = page.properties;
          return {
            id: page.id,
            title: p["제목"]?.title?.[0]?.plain_text || "",
            date: p["날짜"]?.date?.start || "",
            speaker: p["강사"]?.rich_text?.[0]?.plain_text || "",
            scripture: p["성경본문"]?.rich_text?.[0]?.plain_text || "",
            status: p["상태"]?.select?.name || "",
            category: p["카테고리"]?.select?.name || "",
            youtube5: p["YouTube 5분"]?.url || "",
            youtube2: p["YouTube 2분"]?.url || "",
            pdf: p["PDF 자료"]?.url || "",
            summary: p["요약"]?.rich_text?.[0]?.plain_text || ""
          };
        });

        return new Response(JSON.stringify({
          items,
          source: "notion-api",
          updated: new Date().toISOString()
        }), { status: 200, headers: CORS_HEADERS });
      }

      // API 오류 시 (404 = Integration 미연결) → 폴백 사용
      console.log(`Notion API returned ${res.status}, using fallback data`);
    } catch (e) {
      console.log(`Notion API error: ${e.message}, using fallback data`);
    }
  }

  // 폴백: 정적 데이터 반환 (Notion 연결 전까지 사용)
  return new Response(JSON.stringify({
    items: FALLBACK_DATA,
    source: "static-fallback",
    updated: "2026-02-21T00:00:00.000Z",
    note: "Notion Integration 연결 후 자동으로 라이브 데이터로 전환됩니다."
  }), { status: 200, headers: CORS_HEADERS });
};

export const config = { path: "/api/forum-schedule" };
