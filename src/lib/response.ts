export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function serverError(detail: string, status = 500): Response {
  return json({ detail }, status);
}
