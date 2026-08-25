export type UserRole = "admin" | "user";
export type UserStatus = "active" | "inactive";

export type UserProfile = {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
};
