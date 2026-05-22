import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Nammude Kerala | Reddit for Kerala Civic Issues",
  description: "Post civic problems, tag your assembly constituency, discuss publicly, and hold representatives accountable. Together, let's make our voices impossible to ignore.",
  keywords: ["Kerala", "Civic Issues", "MLA Feedback", "Kazhakuttom", "Reddit Kerala", "Governance", "Public Infrastructure", "Nammude Kerala"],
  openGraph: {
    title: "Nammude Kerala | Reddit for Kerala Civic Issues",
    description: "Post civic problems, tag your assembly constituency, discuss publicly, and hold representatives accountable. Together, let's make our voices impossible to ignore.",
    url: "https://nammudekerala.vercel.app",
    siteName: "Nammude Kerala",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nammude Kerala | Reddit for Kerala Civic Issues",
    description: "Post civic problems, tag your assembly constituency, discuss publicly, and hold representatives accountable. Together, let's make our voices impossible to ignore.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Leaflet CSS for interactive mapping support */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="antialiased h-full dark:bg-kerala-dark-bg text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
