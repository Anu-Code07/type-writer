import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import "@/styles/typewriter.css";

export const metadata: Metadata = {
  title: "Type Writer",
  description: "A premium mechanical typewriter journal for focused writing.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171513",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
