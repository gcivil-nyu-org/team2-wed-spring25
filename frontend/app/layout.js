// app/layout.js
import localFont from "next/font/local";
import "./globals.css";
import { icons } from "lucide-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",  // Updated path to match your directory structure
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",  // Updated path to match your directory structure
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Nightwalkers",
  description: "Nightwalkers is a community-driven safety app for navigating New York City",
  icons:{
    icon: '/owl-logo.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}