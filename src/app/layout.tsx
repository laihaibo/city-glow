import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { CelebrationLayer } from "@/components/celebration";
import { Toaster } from "@/components/ui/sonner";
import { CityGlowProvider } from "@/lib/hooks";

export const metadata: Metadata = {
  title: {
    default: "City Glow · 点亮城市",
    template: "%s · City Glow",
  },
  description:
    "带孩子用脚步丈量宁波：标注街巷、记录见闻、点亮城区，把周末散碎时间变成可以十年回看的成长档案。",
  applicationName: "City Glow",
  appleWebApp: {
    capable: true,
    title: "City Glow",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fefcf3" },
    { media: "(prefers-color-scheme: dark)", color: "#171325" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CityGlowProvider>
            <div className="flex min-h-dvh flex-col">
              <DesktopNav />
              {/* 底部留白避开玻璃底栏 + safe-area */}
              <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-16">
                {children}
              </main>
            </div>
            <BottomNav />
            <CelebrationLayer />
            <Toaster position="top-center" />
          </CityGlowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
