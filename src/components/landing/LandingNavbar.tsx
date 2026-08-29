"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { FileStorageLogo } from "@/components/landing/FileStorageLogo";

const navItems = [
  { label: "Features", href: "#features", sectionId: "features" },
  { label: "Security", href: "#security", sectionId: "security" },
  {
    label: "How it works",
    href: "#how-it-works",
    sectionId: "how-it-works",
  },
] as const;

type ActiveSection = (typeof navItems)[number]["sectionId"];
const navSectionIds = navItems.map((item) => item.sectionId);

export function LandingNavbar() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("features");

  const scrollToSection = (sectionId: ActiveSection) => {
    const element = document.getElementById(sectionId);
    if (!element) {
      window.location.hash = sectionId;
      return;
    }

    setActiveSection(sectionId);
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", `#${sectionId}`);
  };

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "") as ActiveSection;
      if (navSectionIds.includes(hash)) {
        setActiveSection(hash);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id as ActiveSection);
        }
      },
      {
        rootMargin: "-28% 0px -56% 0px",
        threshold: [0.15, 0.3, 0.5, 0.7],
      },
    );

    navSectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-white/90 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-3.5">
        <Link href="/" className="shrink-0">
          <FileStorageLogo compact className="scale-[0.92] origin-left" />
        </Link>

        <nav
          aria-label="Landing sections"
          className="hidden items-center rounded-full border border-slate-200/80 bg-white/90 px-1.5 py-1 text-sm font-medium text-slate-500 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)] md:flex"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.sectionId;

            return (
              <button
                key={item.sectionId}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setActiveSection(item.sectionId);
                  scrollToSection(item.sectionId);
                }}
                data-active={isActive ? "true" : "false"}
                className={`relative rounded-full px-4 py-2.5 transition ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-1/2 -bottom-1 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500 transition-all duration-300 ${
                  isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
