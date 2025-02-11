import Image from "next/image";
import { MapIcon, ShieldCheck, Users, Moon, BellRing } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function Home() {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      title: "Smart Safety Routing",
      description: "AI-powered routes optimized for safety using real-time crime data, lighting conditions, and community feedback"
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Walking Buddy System",
      description: "Connect with verified walking companions for added security during your night journey"
    },
    {
      icon: <BellRing className="w-6 h-6 text-blue-500" />,
      title: "Real-time Alerts",
      description: "Stay informed about safety conditions along your route with minimalist, non-intrusive notifications"
    },
    {
      icon: <Moon className="w-6 h-6 text-blue-500" />,
      title: "Night-optimized Interface",
      description: "Clean, simple design focused on essential information for stress-free navigation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <MapIcon className="w-16 h-16 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold">
            Night Walkers
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
            Navigate NYC safely at night with smart routing powered by real-time safety data
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="border-blue-500 text-blue-500 ">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 space-y-4">
                <div className="rounded-full bg-blue-500/10 w-12 h-12 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Safety Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gray-800/50 rounded-lg p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Your Safety is Our Priority</h2>
            <p className="text-gray-300">
              Built for NYC residents, visitors, and everyone in between
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-300">Real-time Protection</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">5+</div>
              <div className="text-gray-300">Safety Data Sources</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">1M+</div>
              <div className="text-gray-300">NYC Residents Served</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-blue-500/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Walk Safer?</h2>
          <p className="text-gray-300 mb-8">
            Join thousands of New Yorkers who are already using Night Walkers for safer navigation.
          </p>
          <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
