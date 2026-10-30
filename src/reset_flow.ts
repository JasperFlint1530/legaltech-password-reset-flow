import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const resetBody = z.object({
  email: z.string().email(),
  matterId: z.string().min(1),
  documentId: z.string().min(1),
  deadline: z.string().datetime()
});

export type ResetInput = z.infer<typeof resetBody>;

export type ResetResult = {
  matterId: string;
  documentId: string;
  followUpAt: string;
  messageId: string;
};

export function followUpAt(deadline: string): string {
  const value = new Date(deadline).getTime() - 24 * 60 * 60 * 1000;
  return new Date(value).toISOString();
}

export async function startReset(client: InfraiClient, input: unknown): Promise<ResetResult> {
  const request = resetBody.parse(input);
  await client.resetRequest(request.email);
  const resetLink = `https://app.example.test/reset?email=${encodeURIComponent(request.email)}`;
  const email = await client.sendResetEmail(request.email, resetLink);
  return {
    matterId: request.matterId,
    documentId: request.documentId,
    followUpAt: followUpAt(request.deadline),
    messageId: email.message_id
  };
}
