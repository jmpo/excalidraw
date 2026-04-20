const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let text: string;
  try {
    const body = await req.json();
    text = (body.text ?? "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: corsHeaders });
  }

  const prompt = `Convert the following text into a mind map using the MindElixir JSON format.

Return ONLY valid JSON — no markdown, no code blocks, no explanation. The JSON must match this exact structure:
{
  "nodeData": {
    "id": "root",
    "topic": "Main topic (max 5 words)",
    "children": [
      {
        "id": "b1",
        "topic": "Branch name (max 6 words)",
        "children": [
          { "id": "b1a", "topic": "Leaf item (max 6 words)" }
        ]
      }
    ]
  }
}

Rules:
- Root topic: the central theme of the text, max 5 words
- Max 7 top-level branches
- Max 5 children per branch
- Each topic: concise, max 6 words
- Use the SAME language as the input text
- All IDs must be unique alphanumeric strings (6-8 chars, no spaces)
- DO NOT include any field other than id, topic, children

Text to convert:
${text.slice(0, 8000)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic error:", err);
    return new Response(JSON.stringify({ error: "AI service error" }), { status: 502, headers: corsHeaders });
  }

  const result = await response.json();
  const rawText: string = result.content?.[0]?.text ?? "";

  // Extract JSON even if model wraps it in markdown fences
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON in response:", rawText);
    return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 502, headers: corsHeaders });
  }

  let mindmapData: unknown;
  try {
    mindmapData = JSON.parse(jsonMatch[0]);
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 502, headers: corsHeaders });
  }

  return new Response(JSON.stringify(mindmapData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
