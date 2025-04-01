import "./globals.css";
import AuthProvider from "@/components/Auth/AuthProvider";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",  // Updated path to match your directory structure
//   variable: "--font-geist-sans",
// });

// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",  // Updated path to match your directory structure
//   variable: "--font-geist-mono",
// });

// export const metadata = {
//   title: "Nightwalkers",
//   description: "Nightwalkers is a community-driven safety app for navigating New York City",
//   icons: {
//     icon: '/owl-logo.svg'
//   }
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> */}
      <body className={`antialiased bg-bglinkedin`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}