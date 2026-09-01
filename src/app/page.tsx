import Link from "next/link";
import {
  Mail,
  Send,
  BarChart3,
  Users,
  LayoutTemplate,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Send,
    title: "Bulk email campaigns",
    description:
      "Send personalized emails to thousands of recipients with queued, rate-limited delivery that gets into the inbox.",
  },
  {
    icon: LayoutTemplate,
    title: "Template builder",
    description:
      "Create beautiful emails with a rich-text editor and personalization variables like {{firstName}}.",
  },
  {
    icon: Users,
    title: "Contacts & lists",
    description:
      "Import contacts from CSV and organize them into segmented lists for targeted campaigns.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track opens, clicks, and bounces with real-time dashboards and per-campaign performance.",
  },
  {
    icon: ShieldCheck,
    title: "Own your domain",
    description:
      "Add your own sending domain with SPF, DKIM, and DMARC records to maximize deliverability.",
  },
  {
    icon: Mail,
    title: "Developer API",
    description:
      "Send transactional emails programmatically with a simple REST API and API keys.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Mailer</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
        <Button asChild>
          <Link href="/register">Get started</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            High-deliverability email platform
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Send emails that actually{" "}
            <span className="text-primary">get delivered</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Mailer is a complete email platform for transactional and marketing
            emails. Build templates, manage contacts, send bulk campaigns, and
            track every open and click.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Start sending free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section
          id="features"
          className="border-y bg-muted/40 py-24"
        >
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Everything you need to send email
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              From one-off transactional messages to large marketing campaigns,
              Mailer has you covered.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border bg-card p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Start free, scale when ready
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign up free and start sending. Self-hosted and ready for your own
            infrastructure.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/register">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-semibold">Mailer</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js. Email delivery powered by Resend.
          </p>
        </div>
      </footer>
    </div>
  );
}
