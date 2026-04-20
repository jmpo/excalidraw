const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  let text: string;
  let availableItems: string[] = [];
  try {
    const body = await req.json();
    text = (body.text ?? "").trim();
    availableItems = Array.isArray(body.availableItems) ? body.availableItems : [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  if (!text) return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: corsHeaders });

  const librarySection = availableItems.length > 0
    ? `\n\nAvailable visual library items:\n${availableItems.map(n => `- "${n}"`).join("\n")}\n\nYou MAY include a "suggestedItems" array with 1–2 item names, but ONLY if the item is a strong, obvious match for the content. Be very selective — it is better to return NO items than to include something that doesn't fit.\n\nGood matches (examples):\n- Business / entrepreneurship content → "Business Model Canvas", "Value Proposition Canvas"\n- Presentation / slides content → "Diap. Portada", "Diap. Timeline", "Diap. Proceso"\n- Chronological / historical content → "Diap. Timeline", "Diap. Timeline 2"\n- Team / people process content → "Diap. Equipo"\n- KPIs / metrics content → "Diap. KPIs", "Diap. Métricas"\n\nDO NOT use:\n- Human figures (Stick man, Guy, Girl, Child, etc.) unless the topic is literally about people, characters, or human roles\n- Generic shapes or notes unless they directly relate\n- Decorative lines unless the layout clearly benefits from a separator\n- Anything that feels forced or tangential\n\nIf no item is a strong match, omit "suggestedItems" entirely or return an empty array.`
    : "";

  const prompt = `You are a whiteboard design assistant. Analyze the following text and create a structured educational whiteboard layout.

Return ONLY valid JSON — no markdown, no code blocks, no explanation. The JSON must match this exact structure:
{
  "title": "Clear main title (max 7 words)",
  "sections": [
    {
      "heading": "Section heading (max 6 words)",
      "color": "#hexcolor",
      "items": [
        "Specific bullet point with real content",
        "Another specific bullet point",
        "Another specific bullet point"
      ]
    }
  ],
  "suggestedItems": ["item name 1", "item name 2"]
}

Rules:
- Create 3 to 6 sections that cover the main themes
- Each section MUST have 3 to 5 meaningful, content-rich items
- Items must contain actual information from the text — NOT placeholders
- Each item: concise sentence, max 10 words, clear and informative
- Colors: use distinct pastel hex colors — rotate through: #fef9c3, #dcfce7, #dbeafe, #fce7f3, #ede9fe, #ffedd5
- Use the SAME language as the input text
- If the text is about a story or narrative, extract key events/characters/themes as sections
- DO NOT return empty items arrays — always fill with real content
- "suggestedItems" is optional — include it only if availableItems are provided and relevant ones exist${librarySection}

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
      max_tokens: 2048,
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
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 502, headers: corsHeaders });

  let whiteboardData: unknown;
  try {
    whiteboardData = JSON.parse(jsonMatch[0]);
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 502, headers: corsHeaders });
  }

  return new Response(JSON.stringify(whiteboardData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
