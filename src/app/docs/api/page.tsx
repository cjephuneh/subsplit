export default function ApiDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">API</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          After a successful payment/top-up, Subsplit issues you an API key (shown once), then only the prefix is visible
          later. Use your key as a Bearer token.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Authentication</h2>
        <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          <code>{`Authorization: Bearer ss_live_xxxxx...`}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Try it with cURL</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Use the Subsplit gateway endpoint. This proxies to our Azure OpenAI backend and charges your wallet based on token
          usage.
        </p>
        <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          <code>{`curl -sS \\
  -X POST "http://localhost:3000/api/v1/chat/completions" \\
  -H "content-type: application/json" \\
  -H "authorization: Bearer ss_live_YOUR_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Say hello from Subsplit." }
    ]
  }'`}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Try it with Postman</h2>
        <div className="space-y-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <div>
            - Method: <span className="font-mono">POST</span>
          </div>
          <div>
            - URL: <span className="font-mono">http://localhost:3000/api/v1/chat/completions</span>
          </div>
          <div>
            - Headers:
            <div className="mt-1 grid gap-1">
              <div>
                <span className="font-mono">content-type</span>: <span className="font-mono">application/json</span>
              </div>
              <div>
                <span className="font-mono">authorization</span>: <span className="font-mono">Bearer ss_live_YOUR_KEY</span>
              </div>
            </div>
          </div>
          <div>
            - Body: <span className="font-mono">raw</span> / <span className="font-mono">JSON</span>
          </div>
        </div>
        <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          <code>{`{
  "model": "gpt-4o",
  "messages": [
    { "role": "user", "content": "What can I build with Subsplit?" }
  ]
}`}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Compute token cost</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          For a model with <span className="font-mono">creditsPer1kTokens</span>:
        </p>
        <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          <code>{`costCredits = ceil(tokens / 1000 * creditsPer1kTokens)`}</code>
        </pre>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Subsplit charges by rounding up to avoid undercharging tiny requests.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Endpoints</h2>
        <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <span className="font-mono">GET /api/models</span> — list models & rates
          </div>
          <div>
            <span className="font-mono">POST /api/credits/spend</span> — spend by tokens & model (ledger entry)
          </div>
          <div>
            <span className="font-mono">GET /api/credits/transactions</span> — ledger history
          </div>
          <div>
            <span className="font-mono">POST /api/v1/chat/completions</span> — Subsplit gateway (calls Azure OpenAI, charges credits)
          </div>
          <div>
            <span className="font-mono">GET /api/sandbox/ping</span> — test an API key (returns wallet)
          </div>
          <div>
            <span className="font-mono">POST /api/keys/create</span> — create an API key (shown once)
          </div>
          <div>
            <span className="font-mono">POST /api/keys/revoke</span> — retire an API key
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Hackathon-ready mode (creative)</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Subsplit is designed to be used in hackathons and teams: pool capacity, issue keys per project,
          loan credits to teammates, and keep an auditable ledger to avoid “who spent what?” arguments.
          It’s also ideal for creators who want predictable spend in a local market.
        </p>
      </div>
    </div>
  );
}

