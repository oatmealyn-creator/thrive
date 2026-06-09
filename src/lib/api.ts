const BACKEND_URL = typeof window !== "undefined" ? window.location.origin : "";

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; status: number }> {
  const sessionId = typeof window !== "undefined" ? localStorage.getItem("session_id") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (sessionId) {
    headers["Authorization"] = `Bearer ${sessionId}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  let data: T;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text as unknown as T;
  }

  if (!res.ok) {
    const err = new Error((data as { detail?: string })?.detail || `Request failed: ${res.status}`) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { data, status: res.status };
}
