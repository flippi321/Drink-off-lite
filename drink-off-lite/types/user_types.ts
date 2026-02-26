export type UserRole = "user" | "admin";

export type Profile = {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
};