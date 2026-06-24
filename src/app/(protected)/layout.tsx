"use client";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useAuth } from "@/lib/hooks/use-auth";
import { useInactivityLogout } from "@/lib/hooks/use-inactivity-logout";
import { ModalProvider } from "@/lib/providers/modal-provider";
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

      <div className="w-[calc(100%-3.5rem)]">
        <Topbar />

        <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-8 max-h-[calc(100dvh-4.5rem)] h-full">
          <ModalProvider>{children}</ModalProvider>
        </div>
      </div>
    </div>
  );
}
