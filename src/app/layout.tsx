import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMA Codegen — AI code generator for your repos",
  description:
    "Paste your CloseRouter key + a GitHub token, pick a repo and a model, and let AI build your project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
