import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FileStorage",
  description: "Secure file storage, sharing, and batch uploads.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
