import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Database,
  FolderOpen,
  Globe2,
  Gauge,
  LockKeyhole,
  MonitorSmartphone,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { FileStorageLogo } from "@/components/landing/FileStorageLogo";
import { HeroTypewriter } from "@/components/landing/HeroTypewriter";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

const heroPills = [
  "5 GB per user quota",
  "Batch uploads",
  "Public and private sharing",
] as const;

const featureCards = [
  {
    title: "Secure storage",
    description: "Keep every file under a clean user scope with S3-backed uploads.",
    icon: ShieldCheck,
  },
  {
    title: "Fast batch upload",
    description: "Drop multiple files at once and track each upload separately.",
    icon: CloudUpload,
  },
  {
    title: "Role-based access",
    description: "Protect private files and give public access only when needed.",
    icon: LockKeyhole,
  },
  {
    title: "Anywhere access",
    description: "Work from desktop or mobile with a responsive file workspace.",
    icon: MonitorSmartphone,
  },
  {
    title: "Smart organization",
    description: "Find files quickly with search, file type badges, and clear status.",
    icon: FolderOpen,
  },
  {
    title: "Simple sharing",
    description: "Copy share links or open downloads without leaving the dashboard.",
    icon: Share2,
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Create an account",
    description: "Register securely in just a few seconds.",
    icon: Users,
  },
  {
    step: "02",
    title: "Upload your files",
    description: "Use single or batch upload with per-file progress.",
    icon: CloudUpload,
  },
  {
    step: "03",
    title: "Access and share",
    description: "Manage, download, and share your files whenever you need.",
    icon: Share2,
  },
] as const;

const stats = [
  { label: "Encrypted", value: "256-bit" },
  { label: "Storage", value: "5 GB" },
  { label: "Upload flow", value: "Batch ready" },
  { label: "Access", value: "Private / Public" },
] as const;

function IconBubble({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15">
      <Icon className="size-5" />
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-[1.6rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <IconBubble icon={icon} />
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </article>
  );
}

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.24)]">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-600">
            {step}
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_-25px_rgba(15,23,42,0.25)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#0b1110] p-4 text-white shadow-[0_35px_100px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <FileStorageLogo compact tone="dark" className="scale-[0.82] origin-left" />
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-400/90" />
            <div className="size-2 rounded-full bg-cyan-400/90" />
            <div className="size-2 rounded-full bg-white/40" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <FolderOpen className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Workspace</p>
                <p className="text-xs text-white/55">Personal storage</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              {[
                "Dashboard",
      
              ].map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    index === 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-white/70"
                  }`}
                >
                  <span className="size-2 rounded-full bg-current/60" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.26em] text-white/45">
                Storage used
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
              </div>
              <p className="mt-2 text-xs text-white/55">1 GB / 5 GB</p>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/95 p-4 text-slate-950">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Storage overview
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">
                      1 GB
                      <span className="text-sm font-medium text-slate-500">
                        {" "}
                        of 5 GB used
                      </span>
                    </p>
                  </div>
                  <IconBubble icon={Database} />
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                </div>
                <p className="mt-3 text-right text-xs text-slate-500">20%</p>
              </div>

           
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white p-4 text-slate-950">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Recent files</p>
                <p className="text-xs text-emerald-600">View all</p>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["Project Proposal.pdf", "PDF", "2.4 MB"],
                  ["Brand Assets.zip", "ZIP", "12.6 MB"],
                  ["Product Video.mp4", "MP4", "43.8 MB"],
                ].map(([name, type, size]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-slate-500">{type}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">{size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eefaf2_52%,_#f8fafc_100%)] pt-24 text-slate-950 sm:pt-28 lg:pt-32">
      <LandingNavbar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="size-3.5" />
              Secure cloud storage
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.07em] text-slate-950 sm:text-6xl lg:text-7xl">
              Your files.
              <span className="mt-2 block text-emerald-600">
                <HeroTypewriter words={["Secure.", "Organized.", "Everywhere."]} />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Store, manage, share, and access your files from anywhere with a
              clean upload flow, quota control, and private or public sharing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.85)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Log in
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {heroPills.map((pill) => (
                <div
                  key={pill}
                  className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.2)]"
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {pill}
                </div>
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-32 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-600">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to manage your files
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A focused workspace for secure uploads, quick search, sharing, and
            easy file management.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section
        id="security"
        className="scroll-mt-32 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[#0a1010] text-white shadow-[0_35px_100px_-40px_rgba(15,23,42,0.65)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Security first
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your files deserve serious protection.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  FileStorage combines private uploads, user scoped quota
                  enforcement, and AWS-backed storage so your workspace stays
                  simple and safe.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Encrypted upload storage",
                  "Private and public files",
                  "Protected download links",
                  "User scoped storage quota",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                  >
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Start secure storage
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/10 blur-3xl" />
              <div className="relative grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Private</p>
                    <LockKeyhole className="size-4 text-emerald-300" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">Only you</p>
                  <p className="mt-2 text-sm text-white/55">
                    Control who can access every upload.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Public</p>
                    <Globe2 className="size-4 text-cyan-300" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">Share links</p>
                  <p className="mt-2 text-sm text-white/55">
                    Create a public file experience when needed.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Fast</p>
                    <Gauge className="size-4 text-emerald-300" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">Batch flow</p>
                  <p className="mt-2 text-sm text-white/55">
                    See upload progress for each file.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">Simple</p>
                    <Search className="size-4 text-emerald-300" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">Find fast</p>
                  <p className="mt-2 text-sm text-white/55">
                    Search and manage files from one dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-32 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-600">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Store your files in three simple steps
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.step} {...step} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#0b1110] px-6 py-8 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.7)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Ready to begin
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Create your FileStorage account and start organizing today.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Create free account
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/60 bg-[#0a1010] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <FileStorageLogo compact tone="dark" />
            <p className="max-w-md text-sm leading-7 text-white/65">
              Secure, simple, organized file storage for modern teams and
              personal workspaces.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Product
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <p>Features</p>
              <p>Security</p>
              <p>Upload management</p>
              <p>Sharing</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Account
            </p>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <p>Login</p>
              <p>Register</p>
              <p>Dashboard</p>
              <p>Support</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 text-center text-sm text-white/45">
          {new Date().getFullYear()} FileStorage. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
