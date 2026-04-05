import { requireSessionUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { listEnrichedApiKeysForUser } from "@/server/api-keys-list";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const keys = await listEnrichedApiKeysForUser(user.id);
    return Response.json({ keys });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return jsonError(401, { error: "UNAUTHORIZED", message: "Sign in first." });
    }
    return jsonError(500, { error: "SERVER_ERROR", message: "Something went wrong." });
  }
}
