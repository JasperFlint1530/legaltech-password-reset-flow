import assert from "node:assert/strict";
import { followUpAt, resetBody } from "./reset_flow.ts";

const deadline = "2026-11-03T12:00:00.000Z";
const parsed = resetBody.parse({
  email: "counsel@example.test",
  matterId: "matter-17",
  documentId: "signed-brief-4",
  deadline
});

assert.equal(parsed.matterId, "matter-17");
assert.equal(followUpAt(parsed.deadline), "2026-11-02T12:00:00.000Z");
assert.throws(() => resetBody.parse({ ...parsed, email: "not-an-email" }));
console.log("reset boundary and deadline decision passed");
