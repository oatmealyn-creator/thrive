import type { APIRoute } from "astro";

const FREE_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
];

const API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.OPENROUTER_API_KEY) ||
  process.env.OPENROUTER_API_KEY ||
  "";

const SYSTEM_PROMPT = `You are a plant and gardening item identifier. Identify what is in the photo.
Reply with ONLY the common name — for example: "Mango Sapling", "Rose", "Terracotta Pot", "Gardening Shears", "Basil", "Monstera", "Cactus".
If it's a plant, just the plant name. If it's a pot, tool, or accessory, name it.
Never add extra words, descriptions, or punctuation. Never say "I'm sorry" or explain.`;

async function tryModel(
  model: string,
  base64Image: string,
): Promise<{ name: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: SYSTEM_PROMPT },
                { type: "image_url", image_url: { url: base64Image } },
              ],
            },
          ],
          max_tokens: 30,
          temperature: 0.1,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) {
        console.log(`[${model}] rate limited`);
        return null;
      }
      console.error(`[${model}] ${res.status}:`, text.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.log(`[${model}] unexpected shape:`, JSON.stringify(json).slice(0, 200));
      return null;
    }

    const name = content.trim().replace(/^["']|["']$/g, "").replace(/[.,!?;:]+$/, "").trim();

    if (!name || name.length > 60) {
      console.log(`[${model}] invalid name: "${content}"`);
      return null;
    }

    return { name };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[${model}] failed:`, msg);
    return null;
  }
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("pot") || lower.includes("planter") || lower.includes("vase") || lower.includes("terracotta") || lower.includes("ceramic") || lower.includes("container")) return "Pots";
  if (lower.includes("tool") || lower.includes("shovel") || lower.includes("rake") || lower.includes("shear") || lower.includes("trowel") || lower.includes("hoe") || lower.includes("fork")) return "Tools";
  if (lower.includes("seed") || lower.includes("bulb") || lower.includes("packet")) return "Seeds";
  if (lower.includes("glove") || lower.includes("stake") || lower.includes("label") || lower.includes("ribbon") || lower.includes("accessory")) return "Accessories";
  return "Plants";
}

export const POST: APIRoute = async ({ request }) => {
  const start = Date.now();
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return new Response(JSON.stringify({ detail: "image_base64 is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const b64Data = image_base64.replace(/^data:image\/[^;]+;base64,/, "");
    const sizeEstimate = Math.round((b64Data.length * 3) / 4 / 1024);
    if (sizeEstimate < 1) {
      return new Response(JSON.stringify({ detail: "Image is too small or empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Image ~${sizeEstimate}KB, API key set: ${API_KEY ? "yes" : "NO!"}, trying models...`);

    if (!API_KEY) {
      return new Response(
        JSON.stringify({
          confidence: "low",
          name: "Unknown Plant",
          category: "Plants",
          description: "AI is not configured. Please type the details manually.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    let plantName = "";
    let usedModel = "";

    for (const model of FREE_MODELS) {
      const result = await tryModel(model, image_base64);
      if (result) {
        plantName = result.name;
        usedModel = model;
        console.log(`[${model}] → "${plantName}"`);
        break;
      }
    }

    if (!plantName) {
      console.log("All models exhausted after", Date.now() - start, "ms");
      return new Response(
        JSON.stringify({
          confidence: "low",
          name: "Unknown Plant",
          category: "Plants",
          description: "Could not identify this plant. Please type the details manually.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const category = guessCategory(plantName);

    console.log(`Result in ${Date.now() - start}ms: "${plantName}" (${category}) via ${usedModel}`);

    return new Response(
      JSON.stringify({
        confidence: "high",
        name: plantName,
        category,
        description: `A ${plantName.toLowerCase()} — perfect for your garden.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("AI error after", Date.now() - start, "ms:", msg);
    return new Response(JSON.stringify({ detail: "AI recognition failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
