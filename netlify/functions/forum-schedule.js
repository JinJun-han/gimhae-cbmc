// Netlify Serverless Function — Notion DB → 포럼 일정 JSON
// 환경변수: NOTION_API_KEY, NOTION_FORUM_DB_ID
export default async (req) => {
  const NOTION_KEY = Netlify.env.get("NOTION_API_KEY");
  const DB_ID = Netlify.env.get("NOTION_FORUM_DB_ID") || "faa5b72b-7a3b-4bc0-bb72-3d07478764e0";

  if (!NOTION_KEY) {
    return new Response(JSON.stringify({ error: "NOTION_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

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

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: "Notion API error", detail: err }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const data = await res.json();

    // Notion 응답을 간결한 JSON으로 변환
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

    return new Response(JSON.stringify({ items, updated: new Date().toISOString() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300, s-maxage=600"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = { path: "/api/forum-schedule" };
