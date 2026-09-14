import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const publishableKey =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const client = createClient(supabaseUrl, publishableKey);

    if (request.method === "GET") {
      let query = client
        .from("profiles")
        .select("id, name, instagram, linkedin, about, tone, photo_url, owner_id, created_at")
        .order("created_at", { ascending: true });

      const id = url.searchParams.get("id");
      if (id) query = query.eq("id", id);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (request.method === "POST") {
      const authorization = request.headers.get("Authorization");
      if (!authorization?.toLowerCase().startsWith("bearer ")) {
        return json({ error: "Sign in before creating a profile." }, 401);
      }

      const token = authorization.replace(/^Bearer\s+/i, "");
      const userClient = createClient(supabaseUrl, publishableKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: authData, error: authError } = await userClient.auth.getUser(token);
      if (authError || !authData.user) return json({ error: "Invalid login session." }, 401);

      const body = await request.json();
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const instagram = typeof body.instagram === "string" ? body.instagram.trim().replace(/^@/, "") : "";
      const linkedin = typeof body.linkedin === "string" ? body.linkedin.trim() : null;
      const about = typeof body.about === "string" ? body.about.trim() : null;
      const tone = typeof body.tone === "string" ? body.tone : "rose";

      if (!name || name.length > 40 || !/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) {
        return json({ error: "Name or Instagram username is invalid." }, 422);
      }
      if (!["rose", "olive", "lilac", "cream", "blue"].includes(tone)) {
        return json({ error: "Card tone is invalid." }, 422);
      }

      const { data, error } = await userClient
        .from("profiles")
        .insert({ owner_id: authData.user.id, name, instagram, linkedin, about, tone })
        .select("id, name, instagram, linkedin, about, tone, photo_url, owner_id, created_at")
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data }, 201);
    }

    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
