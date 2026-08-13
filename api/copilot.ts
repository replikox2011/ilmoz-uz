export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { provider, ...payload } = body;

    const isGroq = provider === "groq";
    let apiKey = isGroq
      ? (process.env.GROQ_API_KEY || process.env.REACT_APP_GROQ_API_KEY)
      : (process.env.OPENROUTER_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY);

    if (payload.model === "google/gemma-4-26b-a4b-it:free") {
      apiKey = process.env.LAGUNA_API_KEY || apiKey;
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `API key for ${payload.model || (isGroq ? "Groq" : "OpenRouter")} is not set in server environment.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUrl = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (!isGroq) {
      headers["HTTP-Referer"] = "https://nexo-eos.app";
      headers["X-Title"] = "NexoGPT";
    }

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": upstreamRes.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
