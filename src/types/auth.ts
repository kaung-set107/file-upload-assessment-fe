export type LoginResponse = {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
  };
};
