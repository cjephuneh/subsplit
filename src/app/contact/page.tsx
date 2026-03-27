import Link from "next/link";

export const runtime = "nodejs";

const CONTACT_EMAIL = "calebjephuneh@gmail.com";
const WHATSAPP_URL = "https://wa.me/254708419386";

function mailto(input: { subject: string; body: string }) {
  const params = new URLSearchParams();
  params.set("subject", input.subject);
  params.set("body", input.body);
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

export default function ContactPage() {
  const partnerMailto = mailto({
    subject: "Partner with Subsplit — Hackathon / Collaboration",
    body:
      "Hi Subsplit team,\n\nWe'd like to partner with you on:\n- Hackathon sponsorship / credits\n- Community workshop\n- API integration partnership\n\nDetails:\n- Organization:\n- Dates:\n- Expected participants:\n- What you need from Subsplit:\n\nThanks,\n",
  });

  const creditsMailto = mailto({
    subject: "Request credits — Subsplit",
    body:
      "Hi Subsplit team,\n\nI'd like to request credits for:\n- Project / use case:\n- Expected monthly usage:\n- Timeline:\n- Contact info:\n\nThanks,\n",
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / Contact
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Contact us</h1>
        <p className="max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">
          Reach us for support, partnerships, hackathons, or credit requests.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Contact</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</div>
              <a className="font-medium underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`} aria-label="Email Subsplit">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">WhatsApp</div>
              <a
                className="font-medium underline underline-offset-4"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Open WhatsApp chat"
              >
                wa.me/+254708419386
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Partner / request credits</h2>
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            Want to partner with Subsplit for a hackathon, workshop, or community program? Or need credits for a project?
            Use the quick actions below.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              href={partnerMailto}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              aria-label="Partner with us"
            >
              Partner with us
            </a>
            <a
              href={creditsMailto}
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-5 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
              aria-label="Request credits"
            >
              Request credits
            </a>
          </div>

          <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
            Tip: include dates, expected participants, and your budget/needs.
          </div>
        </section>
      </div>
    </main>
  );
}

