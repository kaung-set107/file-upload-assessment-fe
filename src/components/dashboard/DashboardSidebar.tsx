"use client";

import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, Upload, Users, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { FileStorageLogo } from "@/components/landing/FileStorageLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

type UserProfile = {
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
  };
};

type DashboardSidebarStats = {
  totalFiles: number;
  publicFiles: number;
  privateFiles: number;
};

type DashboardSidebarProps = {
  userProfile: UserProfile | null;
  stats?: DashboardSidebarStats;
};

function getInitials(name?: string) {
  if (!name?.trim()) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardSidebar({
  userProfile,
  stats,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isUploadsPage = pathname.startsWith("/dashboard/uploads");
  const isUsersPage = pathname.startsWith("/dashboard/users");
  const isAdmin = userProfile?.user.role === "admin";
  const menuLabel = isAdmin ? "Workspace dashboard" : "Uploads";
  const menuHref = isAdmin ? "/dashboard/users" : "/dashboard/uploads";
  const isMenuActive = isAdmin ? isUsersPage : isUploadsPage;

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        skipToast: true,
      });
    } catch {
      // Still redirect if logout API fails
    } finally {
      setMobileMenuOpen(false);
      Cookies.remove("accessToken", { path: "/" });
      toast.success("Logout successful");
      router.replace("/");
    }
  };

  const handleNavigate = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  const SidebarContent = ({ compact = false }: { compact?: boolean }) => {
    const totalFiles = stats?.totalFiles ?? 0;
    const publicFiles = stats?.publicFiles ?? 0;
    const privateFiles = stats?.privateFiles ?? 0;
    const publicPercent =
      totalFiles > 0 ? Math.round((publicFiles / totalFiles) * 100) : 0;
    const privatePercent = Math.max(100 - publicPercent, 0);

    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
        <div
          className={cn(
            "border-b border-border/60",
            compact ? "px-5 py-5" : "px-5 py-5",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <FileStorageLogo compact className="scale-[0.9] origin-left" />

            {compact ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-2xl"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close dashboard menu"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col gap-4",
            compact ? "px-5 py-5" : "p-5",
          )}
        >
          <div className="space-y-2">
            <div className="space-y-2">
              <Button
                type="button"
                variant={isMenuActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 rounded-2xl px-4 py-3 text-sm"
                onClick={() => handleNavigate(menuHref)}
                aria-current={isMenuActive ? "page" : undefined}
              >
                {isUsersPage ? (
                  <>
                    <Users className="size-4" />
                    Users Management
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="size-4" />
                    Files Management
                  </>
                )}
              </Button>
            </div>
          </div>

          {stats ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-emerald-50/80 p-4 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.38)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-slate-400">
                    File stats
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-950">
                    Workspace overview
                  </h3>
                </div>

                <div className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  Live
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 w-full">
                <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3 flex flex-col justify-center items-center shadow-[0_12px_28px_-22px_rgba(15,23,42,0.25)]">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {stats.totalFiles}
                  </p>
                </div>

                <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3 flex flex-col justify-center items-center shadow-[0_12px_28px_-22px_rgba(15,23,42,0.25)]">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                    Public
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-700">
                    {stats.publicFiles}
                  </p>
                </div>

                <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3 flex flex-col justify-center items-center shadow-[0_12px_28px_-22px_rgba(15,23,42,0.25)]">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                    Private
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-700">
                    {stats.privateFiles}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-slate-200/70 bg-white/75 p-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{publicPercent}% public</span>
                  <span>{privatePercent}% private</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${publicPercent}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                      style={{ width: `${privatePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-auto space-y-3 pt-2">
            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-700 to-slate-400 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
                  {getInitials(userProfile?.user?.name)}
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    {userProfile?.user.name ?? "User"}
                  </CardTitle>

                  <CardDescription className="max-w-[180px] break-all text-sm">
                    {userProfile?.user.email ?? "user@example.com"}
                  </CardDescription>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-40 lg:hidden">
        <Card className="rounded-md border-x-0 border-t-0 border-border/60 bg-background/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur-xl">
          <CardContent className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileStorageLogo compact className="scale-[0.9]  origin-left" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 rounded-2xl"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open dashboard menu"
            >
              <Menu className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent
            showCloseButton={false}
            className="fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(22rem,88vw)] max-w-none -translate-x-0 -translate-y-0 flex-col rounded-none rounded-r-[2rem] border-r border-border/60 bg-background/95 p-0 shadow-[0_30px_100px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          >
            <SidebarContent compact />
          </DialogContent>
      </Dialog>

      <aside className="hidden w-full lg:sticky lg:top-6 lg:block lg:h-[calc(100dvh-3rem)] lg:w-80">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border/60 bg-background/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur-xl">
          <SidebarContent />
        </Card>
      </aside>
    </>
  );
}
