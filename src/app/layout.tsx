import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <QueryProvider>
          <ThemeProvider enableSystem attribute="class" defaultTheme="system">
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
