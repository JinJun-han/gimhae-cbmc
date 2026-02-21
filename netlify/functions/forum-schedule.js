// Netlify Serverless Function — Notion DB → 포럼 일정 JSON
// 환경변수: NOTION_API_KEY, NOTION_FORUM_DB_ID
// 전략: Notion API 먼저 시도 → 실패 시 정적 데이터 폴백

// 2026-02-21 MCP에서 가져온 실제 Notion DB 데이터
const FALLBACK_DATA = [
  {
    id: "30dedb42-7c02-81ba-8751-deef38cec8c3",
    title: "조찬주회 — 임성태 한의박사",
    date: "2026-03-07",
    speaker: "임성태 한의박사 (자연힐 한방병원 병원장)",
    scripture: "",
    status: "예정",
    category: "조찬주회",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: "건강과 비즈니스"
  },
  {
    id: "30dedb42-7c02-8185-977f-cfc882980e51",
    title: "조찬주회 — 최무열 목사",
    date: "2026-02-28",
    speaker: "최무열 목사 (전 부산장신대 총장)",
    scripture: "",
    status: "예정",
    category: "조찬주회",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: "김해한마음지회 지도목사"
  },
  {
    id: "30dedb42-7c02-8137-93c9-c8fdf8aa5f0e",
    title: "설 명절 휴강",
    date: "2026-02-21",
    speaker: "",
    scripture: "",
    status: "휴강",
    category: "휴강",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: "복된 설 명절 보내시기 바랍니다."
  },
  {
    id: "30dedb42-7c02-819a-bb98-d6a133904951",
    title: "설 명절 휴강",
    date: "2026-02-15",
    speaker: "",
    scripture: "",
    status: "휴강",
    category: "휴강",
    youtube5: "",
    youtube2: "",
    pdf: "",
    summary: "복된 설 명절 보내시기 바랍니다."
  },
  {
    id: "30dedb42-7c02-8113-b6a2-cf701609ffa4",
    title: "가짜 복음과 진짜 복음의 차이를 아십니까",
    date: "2026-02-08",
    speaker: "서재찬 박사",
    scripture: "갈라디아서 1:6-10 · 창세기 5:21-27",
    status: "완료",
    category: "조찬주회",
    youtube5: "https://www.youtube.com/watch?v=H_i5L8Qwo9k",
    youtube2: "https://www.youtube.com/watch?v=OerzKuFZ2PQ&list=PLIhQ51lQQFP8s95ZNqD9fZyi1F1rpqYCU&index=1",
    pdf: "",
    summary: "바울의 다메섹 전환점 ↔ 에녹의 므두셀라 전환점 · 므두셀라 969년 심화 · 소그룹 질문 · 간증 프레임워크"
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
