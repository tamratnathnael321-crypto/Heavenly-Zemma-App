import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const MODEL = Deno.env.get("AI_MODEL") ?? "claude-sonnet-5-5";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });

const NAMES = `You are an expert in Amharic (Ge'ez script), Ethiopian music and music-catalogue metadata.
You review artist names, album titles and song titles and propose corrections.
Rules:
- Fix only clear typos: wrong or missing Ge'ez letters, stray spaces/punctuation, inconsistent capitalisation or transliteration, mixed scripts in one word.
- Do NOT translate. Keep the original script. Do not "improve" valid stylistic choices.
- Amharic homophone letters (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ, ጸ/ፀ) are often legitimate: change them only if the word is clearly misspelled.
- Artist merges: propose only when two entries are very probably the same person (spelling variants, Ge'ez vs Latin spelling of the same name, extra spaces). Similar but different artists must NOT be merged. "into" is the better-spelled entry.
- Use only ids you were given. Give confidence 0-1 and a short reason. If unsure, propose nothing.
Reply with JSON only, no prose:
{"merges":[{"from":"id","into":"id","confidence":0.9,"why":""}],"artists":[{"id":"","new":"","confidence":0.9,"why":""}],"albums":[{"id":"","new":"","confidence":0.9,"why":""}],"songs":[{"id":"","new":"","confidence":0.9,"why":""}]}`;

const IMAGE = `You turn an admin's plain-language image command into settings for a canvas photo editor (album covers, artist photos, avatars). You see the current preview, which already includes the current settings.
Return ABSOLUTE final values (not deltas) as JSON only:
{"filters":{"brightness":0-250 (100=normal),"contrast":0-250,"saturate":0-300,"hue":-180..180,"blur":0-20,"gray":0-100,"sepia":0-100,"invert":0-100},
 "zoom":0.2-4,"x":-1..1,"y":-1..1,"fine":-45..45,"flipH":bool,"flipV":bool,"notes":"one sentence on what you did"}
x,y are the image offset as a fraction of the frame width (positive = image moves right/down). Include only keys you want to change. Be moderate: enhancement means gentle brightness/contrast/saturation fixes, tighter crop on the subject, straightening. If the command needs something these controls cannot do (remove background, upscale, retouch), say so in notes and do the closest safe thing.`;

async function claude(system: string, content: unknown) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages: [{ role: "user", content }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message ?? "AI request failed");
  const t = j.content.map((c: { text?: string }) => c.text ?? "").join("");
  return JSON.parse(t.replace(/```json|```/g, "").trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: adm } = await sb.from("admins").select("user_id").maybeSingle();
    if (!adm) return json({ error: "Admins only" }, 403);
    const b = await req.json();
    if (b.action === "names") return json(await claude(NAMES, `Review these ${b.kind}:\n${JSON.stringify(b.items)}`));
    if (b.action === "image") {
      const data = String(b.image ?? "").replace(/^data:image\/\w+;base64,/, "");
      if (!data || data.length > 4_000_000) return json({ error: "Image missing or too large" }, 400);
      return json(await claude(IMAGE, [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data } },
        { type: "text", text: `Command: ${String(b.command).slice(0, 500)}\nCurrent settings: ${JSON.stringify(b.state)}\nFrame shape (width/height): ${b.ar}` },
      ]));
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) { return json({ error: (e as Error).message }, 500); }
});
