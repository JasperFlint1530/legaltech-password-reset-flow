import { InfraiClient } from "./infrai_client.ts";
import { startReset } from "./reset_flow.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const result = await startReset(new InfraiClient(key), {
  email: process.env.RESET_EMAIL ?? "counsel@example.test",
  matterId: "matter-demo",
  documentId: "signed-document-demo",
  deadline: "2026-11-03T12:00:00.000Z"
});
console.log(JSON.stringify(result, null, 2));
