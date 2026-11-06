import type { Metadata } from "next";

export const metadata: Metadata = { title: "探索日记" };

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
