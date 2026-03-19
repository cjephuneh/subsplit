export default function SetupDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Setup</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          This page is for operators deploying Subsplit. Payments are handled internally; end users never
          see Daraja credentials. Configure these environment variables in your hosting provider
          (recommended) or in local <span className="font-mono">.env</span>.
        </p>
      </div>

      <EnvBlock />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Callback URL</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Your callback must be publicly reachable. Either set <span className="font-mono">APP_BASE_URL</span>{" "}
          (recommended) or explicitly override with <span className="font-mono">DARAJA_CALLBACK_URL</span>.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Free credits</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Every new user receives a welcome bonus (currently 50 credits) so developers can test the
          platform before topping up.
        </p>
      </div>
    </div>
  );
}

function EnvBlock() {
  const text = `# Core
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-in-production"
APP_BASE_URL="https://your-domain.com"

# Daraja (M-Pesa) Payments (operator-only)
DARAJA_ENV="production"
DARAJA_CONSUMER_KEY="..."
DARAJA_CONSUMER_SECRET="..."
DARAJA_SHORTCODE="..."
DARAJA_PASSKEY="..."

# Optional: override callback directly (must be public)
DARAJA_CALLBACK_URL="https://your-domain.com/api/payments/mpesa/callback"

# Pricing: user pays 95% of credit value
CREDIT_KES_MULTIPLIER="0.95"`;

  return (
    <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
      <code>{text}</code>
    </pre>
  );
}

