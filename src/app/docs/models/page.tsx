import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { CodeTabs } from "./_components/code-tabs";

export const runtime = "nodejs";

export default async function ModelsDocs() {
  const models = await prisma.modelOffering.findMany({
    orderBy: [{ modelType: "asc" }, { provider: "asc" }, { outputCentsPer1kTokens: "asc" }],
    select: {
      key: true,
      name: true,
      provider: true,
      modelType: true,
      description: true,
      inputCentsPer1kTokens: true,
      outputCentsPer1kTokens: true,
      supportsChat: true,
      supportsImage: true,
      supportsVideo: true,
    },
  });

  const groups = models.reduce<Record<string, typeof models>>((acc, m) => {
    acc[m.modelType] ??= [];
    acc[m.modelType].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Models</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Browse models by type. All models are accessible through the Subsplit gateway using your API key.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([type, items]) => (
          <section key={type} className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">{titleCase(type)}</h2>
            <div className="grid gap-3">
              {items.map((m) => (
                <div
                  key={m.key}
                  className="rounded-[2rem] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {m.name}{" "}
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          ({m.key})
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {m.provider}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      Input {(m.inputCentsPer1kTokens / 100).toFixed(2)} / Output {(m.outputCentsPer1kTokens / 100).toFixed(2)} credits / 1k tokens
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{m.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.supportsChat ? <Badge>Chat</Badge> : null}
                    {m.supportsImage ? <Badge>Image</Badge> : null}
                    {m.supportsVideo ? <Badge>Video</Badge> : null}
                  </div>

                  <CodeTabs snippets={getSnippets(m.key)} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function titleCase(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
}

function getSnippets(modelKey: string) {
  const baseUrl = "https://subsplit.co/api/v1"; // Placeholder, usually dynamic or env-based

  return {
    python: `from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="ss_live_YOUR_KEY"
)

completion = client.chat.completions.create(
    model="${modelKey}",
    messages=[
        { "role": "user", "content": "Hello from Subsplit!" }
    ]
)

print(completion.choices[0].message)`,
    node: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${baseUrl}",
  apiKey: "ss_live_YOUR_KEY",
});

const completion = await client.chat.completions.create({
  model: "${modelKey}",
  messages: [{ role: "user", content: "Hello from Subsplit!" }],
});

console.log(completion.choices[0].message);`,
    curl: `curl "${baseUrl}/chat/completions" \\
  -H "Authorization: Bearer ss_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelKey}",
    "messages": [
      { "role": "user", "content": "Hello from Subsplit!" }
    ]
  }'`,
  };
}
