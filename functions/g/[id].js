// 📍 GeoHunt хуваалцах холбоос: geoexam.mn/g/<id>
// Facebook, Messenger зэрэг роботод уралдааны өөрийн зураг, гарчгийг (og:...) харуулна,
// хүн дарахад шууд geoexam.mn/?g=<id> руу шилжүүлнэ.
const FS = "https://firestore.googleapis.com/v1/projects/geoexam/databases/(default)/documents/geoq/";
const KEY = "AIzaSyCqKbolRnDJKYeM2kJHVmx9haGUwuN0wL4";
const BOT = /facebookexternalhit|facebot|facebookcatalog|meta-externalagent|twitterbot|telegrambot|whatsapp|slackbot|discordbot|linkedinbot|skypeuripreview|viber|googlebot|bingbot|embedly|pinterest/i;
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const PZ = { 12: "1 жилийн эрх", 3: "3 сарын эрх" };

export async function onRequest({ params, request }) {
  const id = String(params.id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const go = "https://geoexam.mn/?g=" + encodeURIComponent(id);
  const ua = request.headers.get("user-agent") || "";
  if (!id) return Response.redirect("https://geoexam.mn/", 302);
  if (!BOT.test(ua)) return Response.redirect(go, 302);   // хүн бол шууд уралдаан руу

  let title = "Энэ зургийг хаана авсан бэ?", img = "https://geoexam.mn/icon-512.png", desc = "Зургийг хаана авсныг Монголын газарзүйн зураг дээр таагаад шагнал аваарай!";
  try {
    const r = await fetch(FS + encodeURIComponent(id) + "?key=" + KEY, { cf: { cacheTtl: 300 } });
    if (r.ok) {
      const f = (await r.json()).fields || {};
      if (f.title && f.title.stringValue) title = f.title.stringValue;
      if (f.img && f.img.stringValue) img = f.img.stringValue;
      const pz = ((f.prizes && f.prizes.arrayValue && f.prizes.arrayValue.values) || []).map((v, i) => { const m = +(v.integerValue || v.doubleValue || 0); return m ? ["🥇", "🥈", "🥉", "4-р байр", "5-р байр"][i] + " " + (PZ[m] || m + " сарын эрх") : ""; }).filter(Boolean).slice(0, 3);
      const end = f.end && f.end.timestampValue ? new Date(f.end.timestampValue) : null;
      if (pz.length) desc = "🎁 " + pz.join(" · ") + ". " + desc;
      if (end) { const d = new Date(end.getTime() + 8 * 3600e3), p = n => String(n).padStart(2, "0"); desc += " ⏰ " + p(d.getUTCMonth() + 1) + "/" + p(d.getUTCDate()) + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + " хүртэл."; }
    }
  } catch (e) {}

  const url = "https://geoexam.mn/g/" + encodeURIComponent(id);
  const html = `<!doctype html><html lang="mn"><head><meta charset="utf-8">
<title>📍 GeoHunt: ${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="GeoExam">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="📍 GeoHunt: ${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="GeoHunt уралдааны зураг">
<meta name="twitter:card" content="summary_large_image">
</head><body><a href="${esc(go)}">GeoHunt уралдаан руу орох</a></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
