import { z } from "zod";

export async function parseJson<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const data: unknown = await req.json().catch(() => undefined);
  return schema.parse(data);
}

