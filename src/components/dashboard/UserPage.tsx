"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Search,
  Shield,
  User,
  Users,
  Loader2,
  CalendarDays,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { UserProfile, UserRole, UserStatus } from "@/types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  status: UserStatus;
};

type UserRecord = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  status?: string | null;
  isActive?: boolean;
};

type UsersResponse = {
  success: boolean;
  users: UserRecord[];
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function normalizeUser(user: UserRecord): UserItem {
  const statusValue =
    typeof user.status === "string" ? user.status.toLowerCase() : "";

  const status =
    statusValue === "inactive" || user.isActive === false
      ? "inactive"
      : "active";

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt ?? new Date().toISOString(),
    status,
  };
}

export default function UsersPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const [profileResponse, usersResponse] = await Promise.all([
        apiFetch<UserProfile>("/users/profile", {
          method: "GET",
          skipToast: true,
        }),

        apiFetch<UsersResponse>("/users", {
          method: "GET",
          skipToast: true,
        }),
      ]);

      setUserProfile(profileResponse);
      setUsers(usersResponse.users.map(normalizeUser));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [users, search]);

  const adminCount = users.filter((user) => user.role === "admin").length;

  const normalUserCount = users.filter((user) => user.role === "user").length;

  const toggleUserStatus = async (user: UserItem) => {
    const nextStatus: UserStatus =
      user.status === "active" ? "inactive" : "active";

    try {
      setUpdatingUserId(user._id);

      await apiFetch(`/users/${user._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
        skipToast: true,
      });

      setUsers((current) =>
        current.map((currentUser) =>
          currentUser._id === user._id
            ? { ...currentUser, status: nextStatus }
            : currentUser,
        ),
      );

      toast.success(`User marked ${nextStatus}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update user status.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.72))] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 lg:flex-row lg:px-8">
        <DashboardSidebar userProfile={userProfile} />
        <main className="min-h-screen bg-muted/40 p-4 md:p-8 w-full">
          <div className=" space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6" />

                  <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage and view registered users.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Total */}
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Users className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>

                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Admin */}
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Shield className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Administrators
                    </p>

                    <p className="text-2xl font-bold">{adminCount}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Normal Users */}
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <User className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Regular Users
                    </p>

                    <p className="text-2xl font-bold">{normalUserCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>

                <CardDescription>
                  {search
                    ? `${filteredUsers.length} users found`
                    : `${users.length} registered users`}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="flex min-h-[350px] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" />

                      <p className="text-sm text-muted-foreground">
                        Loading users...
                      </p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex min-h-[350px] flex-col items-center justify-center px-4 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <h3 className="mt-4 font-semibold">No users found</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {search
                        ? "Try a different search term."
                        : "There are no registered users yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user._id}>
                            {/* User */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-700 to-slate-500 text-sm font-semibold text-white shadow-lg">
                                  {getInitials(user.name)}
                                </div>

                                <div className="min-w-0">
                                  <CardTitle className="truncate text-lg">
                                    {user.name}
                                  </CardTitle>
                                  <CardDescription className="truncate">
                                    {user.email}
                                  </CardDescription>
                                </div>
                              </div>
                            </TableCell>

                            {/* Email */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />

                                <span>{user.email}</span>
                              </div>
                            </TableCell>

                            {/* Role */}
                            <TableCell>
                              {user.role === "admin" ? (
                                <Badge variant="default" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <User className="h-3 w-3" />
                                  User
                                </Badge>
                              )}
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />

                                {formatDate(user.createdAt)}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center justify-end gap-3">
                                <Badge
                                  variant={
                                    user.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {user.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                                </Badge>

                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={user.status === "active"}
                                    onChange={() => void toggleUserStatus(user)}
                                    disabled={updatingUserId === user._id}
                                    aria-label={`Set ${user.name} to ${user.status === "active" ? "inactive" : "active"}`}
                                    className="h-4 w-4 rounded border-border accent-primary"
                                  />
                                </label>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
