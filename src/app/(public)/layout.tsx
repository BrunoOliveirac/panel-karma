"use client";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { user, isLoading } = { user: null, isLoading: true };
  // const { user, isLoading } = useAuth();

  // if (isLoading) return <p>Carregando...</p>;

  // if (!user) {
  //   redirect("/login");
  // }

  return <>{children}</>;
}
