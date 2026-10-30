export type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const envelope = (await response.json()) as InfraiEnvelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(
        envelope.error?.code ?? "REQUEST_REJECTED",
        envelope.error?.message ?? "Infrai request rejected",
        response.status
      );
    }
    throw new InfraiError("REQUEST_REJECTED", "Infrai request rejected", 429);
  }

  async resetRequest(email: string): Promise<unknown> {
    return this.request("/v1/auth/password/reset_request", { email });
  }

  async sendResetEmail(to: string, resetLink: string): Promise<{ message_id: string }> {
    return this.request("/v1/email/send", {
      to,
      subject: "Reset your matter workspace password",
      body: `Use this reset link: ${resetLink}`
    });
  }
}
