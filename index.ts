// Supabase Edge Function: song-download
// Deploy:  supabase functions deploy song-download
// Only premium users get a signed link; everyone else receives 403 {"error":"premium_required"}.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1) who is calling?
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: auth, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !auth.user) return reply({ error: "login_required" }, 401);

    // 2) are they premium? (checked here on the server, not in the browser)
    const { data: me } = await admin.from("users").select("subscription_tier").eq("id", auth.user.id).maybeSingle();
    if (!me || me.subscription_tier !== "premium") return reply({ error: "premium_required" }, 403);

    // 3) find the song
    const { song_id } = await req.json();
    const { data: song, error: songErr } = await admin
      .from("songs").select("title,file_url,artists(name),albums(title)").eq("id", song_id).maybeSingle();
    if (songErr || !song || !song.file_url) return reply({ error: "song_not_found" }, 404);

    // 4) short-lived signed link from the private "Songs" bucket
    const { data: signed, error: signErr } = await admin.storage.from("Songs").createSignedUrl(song.file_url, 300);
    if (signErr || !signed) return reply({ error: "could_not_sign_file" }, 500);

    const ext = (song.file_url.match(/\.[A-Za-z0-9]{2,5}$/) || [".mp3"])[0].toLowerCase();
    return reply({
      url: signed.signedUrl,
      title: song.title,
      artist: song.artists?.name ?? "Unknown artist",
      album: song.albums?.title ?? "Single",
      ext,
    });
  } catch (e) {
    return reply({ error: String((e as Error).message || e) }, 500);
  }
});
