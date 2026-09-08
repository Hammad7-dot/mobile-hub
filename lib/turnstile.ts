type TurnstileResult = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function verifyTurnstile(request: Request, token: string, expectedAction: "checkout" | "sell_phone") {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV === "development" && token === "development-bypass";
  if (!token || token.length > 2048) return false;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const address = clientAddress(request);
  if (address !== "unknown") body.set("remoteip", address);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as TurnstileResult;
    return result.success && result.action === expectedAction;
  } catch {
    return false;
  }
}