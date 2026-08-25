"use client";

import { LayoutDashboard, LogOut, Users } from "lucide-react";
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
import { success } from "zod";

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
    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
      <Card className="flex h-full flex-col border-border/60 bg-background/85 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
        {/* Profile */}
        <CardHeader className="space-y-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-700 to-slate-500 text-sm font-semibold text-white shadow-lg">
              {getInitials(userProfile?.user?.name)}
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {userProfile?.user.name ?? "User"}
              </CardTitle>

              <CardDescription className="truncate">
                {userProfile?.user.email ?? ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          {/* Navigation */}

          <Badge variant="outline" className=" bg-green-600 text-white">
            Role : {userProfile?.user.role?.toLocaleUpperCase()}
          </Badge>

          {/* Active View */}
          <div className="mt-2 rounded-2xl border border-border/60 bg-muted/40 p-4">
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

          {/* Logout */}
          <div className="mt-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full"
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
