export default function MpesaDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Payments (M‑Pesa)</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Subsplit uses an internal M‑Pesa checkout flow. Users never see Daraja credentials, callback URLs,
          or payment APIs—only a simple “Pay with M‑Pesa” prompt in the product.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">User experience</h2>
        <div className="grid gap-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <div>
            - Choose model → enter tokens → see a cost estimate.
          </div>
          <div>
            - Click <span className="font-medium">Spend</span> → pick payment method.
          </div>
          <div>
            - Select <span className="font-medium">M‑Pesa</span> → enter phone number → approve the prompt.
          </div>
          <div>
            - Subsplit verifies the payment and updates wallet + ledger automatically.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Operator setup</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Operators must set Daraja credentials and a publicly reachable callback URL. See{" "}
          <span className="font-mono">/docs/setup</span>.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Ledger guarantees</h2>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Subsplit is ledger-first: every successful payment produces a top-up transaction and (for spend checkout)
          an immediate spend transaction. If callbacks are delayed, Subsplit can verify the payment and finalize it.
        </p>
      </div>
    </div>
  );
}

