import type { APIRoute } from "astro";

const HF_MODEL = "microsoft/resnet-50";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return new Response(JSON.stringify({ detail: "image_base64 is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const base64Data = image_base64.replace(/^data:[^;]+;base64,/, "");
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    try {
      const hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: { data: Array.from(bytes) } }),
        },
      );

      if (hfResponse.ok) {
        const result = await hfResponse.json();
        const top = result[0]?.label || "Unknown Plant";
        const confidence = result[0]?.score || 0;

        let category = "Plants";
        const lower = top.toLowerCase();
        if (lower.includes("pot") || lower.includes("planter") || lower.includes("vase")) category = "Pots";
        else if (lower.includes("tool") || lower.includes("shovel") || lower.includes("rake") || lower.includes("shear")) category = "Tools";
        else if (lower.includes("seed") || lower.includes("bulb")) category = "Seeds";
        else if (lower.includes("accessory") || lower.includes("stake") || lower.includes("label") || lower.includes("glove")) category = "Accessories";

        return new Response(
          JSON.stringify({
            confidence: confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low",
            name: top,
            category,
            description: `A ${top.toLowerCase()} — perfect for your garden.`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch {
      // HF API failed, fall through to fallback
    }

    return new Response(
      JSON.stringify({
        confidence: "low",
        name: "Unknown Plant",
        category: "Plants",
        description: "Could not identify this plant. Please type the details manually.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("AI detection error:", err);
    return new Response(JSON.stringify({ detail: "AI recognition failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
