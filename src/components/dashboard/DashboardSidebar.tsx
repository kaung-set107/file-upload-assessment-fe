"use client";

import { LayoutDashboard, LogOut, Upload, Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Badge } from "../ui/badge";

type UserProfile = {
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
  };
};

type DashboardSidebarProps = {
  userProfile: UserProfile | null;
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

export function DashboardSidebar({ userProfile }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        skipToast: true,
      });
    } catch {
      // Still redirect if logout API fails
    } finally {
      Cookies.remove("accessToken", { path: "/" });
      toast.success("Logout successful");
      router.replace("/login");
    }
  };

  const isUploadsPage = pathname.startsWith("/dashboard/uploads");
  const isUsersPage = pathname.startsWith("/dashboard/users");

  return (
    <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
      <Card className="flex h-full flex-col border-border/60 bg-background/90 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur-xl">
        <CardHeader className="space-y-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-700 to-slate-400 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
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
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          <Badge
            variant="outline"
            className="w-fit border-emerald-200 bg-emerald-500/10 text-emerald-700"
          >
            Role: {userProfile?.user.role?.toLocaleUpperCase() ?? "USER"}
          </Badge>

          <div className="space-y-2">
            <p className="px-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Menu
            </p>

            <div className="space-y-2">
              {userProfile?.user.role === "admin" ? (
                <Button
                  type="button"
                  variant={
                    userProfile?.user.role === "admin" ? "secondary" : "ghost"
                  }
                  className="w-full justify-start gap-3 rounded-2xl px-4 py-3 text-sm"
                  onClick={() => router.push("/dashboard/users")}
                >
                  <LayoutDashboard className="size-4" />
                  Workspace dashboard
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={
                    userProfile?.user.role === "user" ? "secondary" : "ghost"
                  }
                  className="w-full justify-start gap-3 rounded-2xl px-4 py-3 text-sm"
                  onClick={() => router.push("/dashboard/uploads")}
                >
                  <Upload className="size-4" />
                  Uploads
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-emerald-800">
              Upgrade your workspace
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-700/80">
              Get more storage and advanced features.
            </p>

            <Button
              type="button"
              className="mt-4 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Upgrade now
            </Button>
          </div>

          <div className="mt-auto space-y-3 pt-2">
            <div className="rounded-2xl border border-border/60 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Active view
              </p>

              <div className="mt-3 flex items-center gap-2 font-medium">
                {isUsersPage ? (
                  <>
                    <Users className="size-4" />
                    User management
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="size-4" />
                    Workspace dashboard
                  </>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
