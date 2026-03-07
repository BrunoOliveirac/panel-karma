"use client";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useAuth } from "@/lib/hooks/use-auth";
import { useInactivityLogout } from "@/lib/hooks/use-inactivity-logout";
import Image from "next/image";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useInactivityLogout();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Image
          alt="logo"
          width={100}
          height={100}
          loading="eager"
          unoptimized={true}
          src="/images/loading.gif"
        />
      </div>
    );
  }

  return (
    <div className="flex h-dvh p-2">
      <Sidebar />

      <div className="w-full">
        <Topbar />

        <div className="px-3">{children}</div>
      </div>
    </div>
  );
}
