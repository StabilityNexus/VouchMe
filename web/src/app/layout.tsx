import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VouchMe",
  description:
    "VouchMe enables trust in decentralized ecosystems by allowing users to vouch for each other and provide testimonials, building a transparent and verifiable reputation system.",
  keywords:
    "VouchMe, decentralized trust, reputation system, testimonials, blockchain, vouching, secure, Web3, Stability Nexus",
  robots: "index, follow",
};

// openGraph: {
//   type: "website",
//   url: "WEBSITE URL",
//   title: "VouchMe",
//   description:
//     "VouchMe helps users establish trust in Web3 communities through a transparent and verifiable reputation system powered by blockchain, with testimonial support.",
//   images: [
//     {
//       url: "IMAGE URL",
//       width: 1200,
//       height: 630,
//       alt: "VouchMe Logo",
//     },
//   ],
// },

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
