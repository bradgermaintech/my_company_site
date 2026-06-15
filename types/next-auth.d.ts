import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/models";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      avatar: string;
    };
  }

  interface User {
    role?: UserRole;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    avatar?: string;
  }
}
