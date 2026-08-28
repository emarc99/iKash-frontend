const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

let cachedToken: string | null = null;
let inFlight: Promise<string> | null = null;

function getApiBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("Backend API URL is not configured.");
    return apiUrl;
}

export function clearCsrfToken(): void {
    cachedToken = null;
}

export async function getCsrfToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && cachedToken) return cachedToken;
    if (forceRefresh) cachedToken = null;

    if (!inFlight) {
        inFlight = (async () => {
            const res = await fetch(`${getApiBaseUrl()}/auth/csrf`, {
                method: "GET",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Could not obtain a CSRF token from the server.");
            }

            const data = (await res.json()) as { csrfToken?: string };
            if (!data.csrfToken) {
                throw new Error("Server did not return a CSRF token.");
            }

            cachedToken = data.csrfToken;
            return data.csrfToken;
        })();

        inFlight.catch(() => undefined).finally(() => {
            inFlight = null;
        });
    }

    return inFlight;
}

function isCsrfRejection(status: number, body: string): boolean {
    return status === 403 && body.toUpperCase().includes("CSRF");
}

export async function csrfFetch(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const method = (options.method ?? "GET").toUpperCase();
    const requiresToken = !SAFE_METHODS.includes(method);

    const send = async (token: string | null): Promise<Response> => {
        const headers = new Headers(options.headers);
        if (token) headers.set(CSRF_HEADER_NAME, token);
        return fetch(url, { ...options, headers, credentials: "include" });
    };

    if (!requiresToken) return send(null);

    const res = await send(await getCsrfToken());
    if (res.ok || res.status !== 403) return res;

    let body: string;
    try {
        body = await res.clone().text();
    } catch {
        return res;
    }

    if (!isCsrfRejection(res.status, body)) return res;

    return send(await getCsrfToken(true));
}
