export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** SWR fetcher: takes an API path (e.g. "/api/hello") and returns parsed JSON. */
export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Send a mutation (POST/PATCH/DELETE) with an optional JSON body. */
export async function send<T = void>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(`${method} ${path} failed with ${res.status}`, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** SWR `mutate` filter: revalidate every cached API response after a change. */
export const allApiKeys = (key: unknown) => typeof key === "string" && key.startsWith("/api/");
