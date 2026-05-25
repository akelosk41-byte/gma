import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GMA Codegen — AI code generator for your repos",
  description:
    "Sign in with GitHub, connect your CloseRouter API key, pick a repo and a model, and let AI build your project.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
