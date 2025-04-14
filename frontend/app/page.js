import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Navigation, Shield, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedBackground from "./custom-components/AnimatedBackground";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative h-screen w-full text-white overflow-y-auto">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {/* Mobile: full dark bg */}
          <div className="block md:hidden h-full w-full bg-[#0d1b2a]" />
          {/* Desktop: split bg with left light for phone, right dark for text */}
          <div className="hidden md:grid grid-cols-3 h-full w-full">
            <div className="bg-[#1b263b]" />        {/* Left: phone bg */}
            <div className="col-span-2 bg-[#0d1b2a]" /> {/* Right: text bg */}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full w-full flex flex-col-reverse md:flex-row-reverse items-center justify-center px-6 py-8 md:py-0">
          {/* Text Content */}
          <div className="w-full md:w-2/3 space-y-6 flex flex-col justify-center items-center md:items-start md:pl-16">
            <Image
              src="/owl-logo.svg"
              width={64}
              height={64}
              alt="Logo"
              className="animate-float mt-4 md:mt-0 hidden md:block [@media(max-height:500px)]:hidden"
            />

            <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-blue-200 text-sm">
              <Shield className="w-4 h-4" />
              Safe Navigation for Everyone
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-center md:text-left">
              Navigate Safely with <span className="text-blue-300">Nightwalkers</span>
            </h1>
            <p className="text-blue-100 text-base max-w-xl text-center md:text-left">
              Real-time data and community insights help you avoid unsafe areas and walk confidently at night.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <Link href="/login">
                <Button className="w-full bg-white text-blue-800 font-semibold hover:bg-blue-100 transition">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full border border-white text-white hover:bg-white/10 transition">Create Account</Button>
              </Link>
            </div>
          </div>

          {/* Phone Image */}
          <div className="w-full md:w-1/3 flex justify-center md:items-center mt-8 md:mt-0 h-auto md:h-full">
            <div className="relative h-[40vh] sm:h-[45vh] md:h-[60vh] lg:h-[75vh] aspect-[9/18] max-h-[90vh]">
              <Image
                src="/images/landing-phone.png"
                alt="Nightwalkers App Preview"
                fill
                className="rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Nightwalkers Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform combines real-time data with community insights to
              help you navigate safely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "01",
                title: "Enter Your Route",
                description:
                  "Input your starting point and destination to get personalized safety recommendations.",
              },
              {
                step: "02",
                title: "View Safety Data",
                description:
                  "See real-time safety information, including heat maps and community reports.",
              },
              {
                step: "03",
                title: "Navigate Safely",
                description:
                  "Follow the suggested route with live updates and alerts from the community.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative p-6 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div className="text-5xl font-bold text-blue-100 absolute right-4 top-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 relative z-10">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Data Sources Section */}
          <div className="rounded-2xl bg-blue-50 p-8 mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Powered by Reliable Data Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  NYC Open Data Integration
                </h4>
                <p className="text-gray-600">
                  We utilize official NYC Open Data and NYPD datasets to provide
                  accurate historical safety information.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Community Reports
                </h4>
                <p className="text-gray-600">
                  Real-time updates from community members help keep safety
                  information current and relevant.
                </p>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Key Safety Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-12">
              Comprehensive tools designed to enhance your safety while
              navigating the city
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Real-time Heat Maps",
                  description:
                    "Visualize safety levels across different areas with our interactive heat map system.",
                },
                {
                  title: "Community Forum",
                  description:
                    "Connect with others to share and receive safety updates about your neighborhood.",
                },
                {
                  title: "Route Optimization",
                  description:
                    "Get personalized route suggestions based on current safety conditions.",
                },
                {
                  title: "Instant Alerts",
                  description:
                    "Receive immediate notifications about safety concerns along your route.",
                },
                {
                  title: "Safety Resources",
                  description:
                    "Access a curated list of local safety resources and emergency contacts.",
                },
                {
                  title: "Customizable Settings",
                  description:
                    "Tailor the app's features to match your specific safety preferences.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
