import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Navigation, Shield, AlertCircle } from 'lucide-react';
import Image from 'next/image'
import Link from 'next/link'
import AnimatedBackground from "./custom-components/AnimatedBackground";
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/50 to-blue-900/80"></div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 pt-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left side - Hero Text */}
            <div className="text-center lg:text-left lg:w-1/2 space-y-6">
              <div>
                <Image
                className="animate-float mx-auto lg:mx-0"
                  src="/owl-logo.svg"
                  width={64}
                  height={64}
                  alt="Nightwalkers Logo"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/20 rounded-full text-blue-200 backdrop-blur-sm animate-float">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Safe Navigation for Everyone</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-white">
                Navigate Safely with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  Nightwalkers
                </span>
              </h1>

              <p className="text-lg text-blue-100 max-w-xl">
                Using real-time data and community insights to provide the safest routes for your journey.
              </p>

            </div>

            {/* Right side - Auth Card */}
            <Card className="w-full lg:w-96 bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8">
                <div className="">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white mb-2">Join Nightwalkers</h2>
                    <p className="text-blue-200 text-sm">Access safe navigation and community alerts</p>
                  </div>
                  <Link href="/users/login" className="">
                    <Button
                      size="lg"
                      className="w-full bg-white text-blue-600 mt-3 hover:bg-blue-50 font-semibold transition-colors duration-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href={`/users/register`}>
                    <Button
                      size="lg"
                      className="w-full mt-3 text-white border-white/50 hover:bg-white/10 transition-colors duration-300"
                    >
                      Create Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Nightwalkers Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform combines real-time data with community insights to help you navigate safely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Enter Your Route',
                description: 'Input your starting point and destination to get personalized safety recommendations.'
              },
              {
                step: '02',
                title: 'View Safety Data',
                description: 'See real-time safety information, including heat maps and community reports.'
              },
              {
                step: '03',
                title: 'Navigate Safely',
                description: 'Follow the suggested route with live updates and alerts from the community.'
              }
            ].map((item, index) => (
              <div key={index} className="relative p-6 rounded-lg border border-gray-100 bg-gray-50">
                <div className="text-5xl font-bold text-blue-100 absolute right-4 top-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 relative z-10">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Data Sources Section */}
          <div className="rounded-2xl bg-blue-50 p-8 mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Powered by Reliable Data Sources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">NYC Open Data Integration</h4>
                <p className="text-gray-600">
                  We utilize official NYC Open Data and NYPD datasets to provide accurate historical safety information.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Community Reports</h4>
                <p className="text-gray-600">
                  Real-time updates from community members help keep safety information current and relevant.
                </p>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Safety Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-12">
              Comprehensive tools designed to enhance your safety while navigating the city
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Real-time Heat Maps',
                  description: 'Visualize safety levels across different areas with our interactive heat map system.'
                },
                {
                  title: 'Community Forum',
                  description: 'Connect with others to share and receive safety updates about your neighborhood.'
                },
                {
                  title: 'Route Optimization',
                  description: 'Get personalized route suggestions based on current safety conditions.'
                },
                {
                  title: 'Instant Alerts',
                  description: 'Receive immediate notifications about safety concerns along your route.'
                },
                {
                  title: 'Safety Resources',
                  description: 'Access a curated list of local safety resources and emergency contacts.'
                },
                {
                  title: 'Customizable Settings',
                  description: 'Tailor the app\'s features to match your specific safety preferences.'
                }].map((feature, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
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

