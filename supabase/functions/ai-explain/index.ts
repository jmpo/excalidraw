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

  let topic: string;
  let context: string;
  let level: string;

  try {
    const body = await req.json();
    topic = (body.topic ?? "").trim();
    context = (body.context ?? "").trim();   // parent + siblings context
    level = (body.level ?? "secondary").trim(); // primary / secondary / university
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
  }

  if (!topic) {
    return new Response(JSON.stringify({ error: "topic is required" }), { status: 400, headers: corsHeaders });
  }

  const levelMap: Record<string, string> = {
    primary: "primaria (niños de 6-12 años, vocabulario muy simple, analogías cotidianas)",
    secondary: "secundaria (adolescentes de 12-18 años, vocabulario accesible, ejemplos prácticos)",
    university: "universitario (adultos, vocabulario técnico, ejemplos profesionales)",
  };
  const levelDesc = levelMap[level] ?? levelMap.secondary;

  const prompt = `Eres un asistente educativo. Explicá el siguiente concepto de forma clara y pedagógica para el nivel ${levelDesc}.

Concepto a explicar: "${topic}"
${context ? `Contexto del mapa mental donde aparece este concepto:\n${context}` : ""}

Respondé en el MISMO IDIOMA del concepto. Estructurá tu respuesta así (usa exactamente estos encabezados en markdown):

## ¿Qué es?
(Definición clara en 2-3 oraciones)

## ¿Por qué importa?
(Relevancia o importancia, 2-3 oraciones)

## Ejemplo concreto
(Un ejemplo práctico y memorable)

## Para recordar
(Una frase clave o mnemotecnia para no olvidarlo)

Sé conciso. No uses listas innecesarias. Máximo 200 palabras en total.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic error:", err);
    return new Response(JSON.stringify({ error: "AI service error" }), { status: 502, headers: corsHeaders });
  }

  const result = await response.json();
  const text: string = result.content?.[0]?.text ?? "";

  return new Response(JSON.stringify({ explanation: text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
