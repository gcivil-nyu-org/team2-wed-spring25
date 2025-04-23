"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import AnimatedBackground from "./custom-components/AnimatedBackground";
import { Disclosure } from "@headlessui/react";
import {Shield, ChevronDown, ShieldCheck, MapPinned, Users, MessageCircle, Star, 
        AlertTriangle, Database, Megaphone,
        LineChart,} from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const steps = [
  {
    title: "Enter Your Start and Destination",
    description: "Just type in where you're coming from and where you're headed, Nightwalkers will handle the rest.",
    image: "/images/enterstart-phone.png",
  },
  {
    title: "Compare Safer vs Standard Routes",
    description: "Toggle between a standard map route and a safe route optimized to avoid high-risk areas.",
    image: "/images/standardsafe-phone.png",
  },
  {
    title: "View Route Details",
    description: "Check the estimated travel time, distance, and walking directions before heading out.",
    image: "/images/route-phone.png",
  },
  {
    title: "Visualize Safety with the Heatmap",
    description: "Use the heatmap to spot nearby areas with higher and lower crime based on NYPD data.",
    image: "/images/heatmap-phone.png",
  },
  {
    title: "Stay Connected with the Community",
    description: "Browse local safety posts, chat with mutuals, and save your favorite routes for future walks.",
    image: "/images/forum-phone.png",
  },
];

const faqs = [
  {
    question: "What data powers the safe route and heatmap?",
    answer:
      "Currently, we use NYPD complaint data from NYC Open Data to highlight high-risk areas. Support for 311 complaints and infrastructure issues is coming in a future update.",
  },
  {
    question: "Can other users see my location?",
    answer:
      "No. Your location is used only on your device to calculate routes and show your position on the map. We never store or share your real-time location with others.",
  },
  {
    question: "How is Nightwalkers different from apps like Citizen or Apple Maps?",
    answer:
      "Nightwalkers is focused on proactive walking safety. While apps like Citizen react to incidents, we provide optimized routes that help you avoid unsafe areas altogether - before you even leave.",
  },
  {
    question: "Can I report safety concerns or issues I notice?",
    answer:
      "Yes! Use the Community Forum to share local safety concerns, suspicious activity, or areas to avoid. Your post can help others stay informed and safer.",
  },
  {
    question: "What types of incidents show up on the map?",
    answer:
      "Right now, the map highlights areas with frequent NYPD complaints such as assaults, harassment, and other public safety issues. Future versions will include infrastructure issues and 311 reports.",
  },
  {
    question: "How do I toggle between safe and standard routes?",
    answer:
      "On the map screen, you’ll find a button labeled 'Safer'. Turn it on to compare our safety-optimized route with the standard route. The safe route prioritizes areas with fewer reported incidents.",
  },
  {
    question: "Do I need an account to use Nightwalkers?",
    answer:
      "Yes, you’ll need to sign up to access route planning, safety data, and community features. This helps us personalize your experience and ensure a safer environment for all users.",
  },  
  {
    question: "How often is the data updated?",
    answer:
      "We pull the latest NYPD complaint data regularly from NYC Open Data. Forum posts and community feedback update in real time.",
  },  
];

function HowItWorksCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevStep = () => {
    setCurrentIndex((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
  };

  const nextStep = () => {
    setCurrentIndex((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-gradient-to-b from-[#f3f8ff] to-white py-12 sm:py-14 md:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          How Nightwalkers Works
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Follow these simple steps to navigate safer routes at night.
        </p>

        <div className="relative max-w-3xl mx-auto px-6 sm:px-0">
          {/* Arrows */}
          <button
            onClick={prevStep}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10
                      p-2 rounded-full border border-gray-300 bg-white text-blue-600 
                      hover:bg-blue-100 transition shadow sm:-left-6"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextStep}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10
                      p-2 rounded-full border border-gray-300 bg-white text-blue-600 
                      hover:bg-blue-100 transition shadow sm:-right-6"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel container */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="min-w-full p-8 flex flex-col items-center text-center bg-white"
                >
                <div className="relative w-[190px] sm:w-[210px] md:w-[240px] lg:w-[260px] aspect-[9/19.5] mb-6">
                  <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="rounded-2xl shadow-lg object-cover"
                    />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-4 h-2 bg-blue-600" : "w-2 h-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

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
            <div className="relative w-[180px] sm:w-[230px] md:w-[280px] lg:w-[300px] aspect-[9/19.5]">
              <Image
                src="/images/landing-phone.png"
                alt="Nightwalkers App Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Intro to Nightwalkers */}
      <section className="bg-gradient-to-b from-[#f3f8ff] to-white py-12 sm:py-14 md:py-16 lg:py-20">

        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What is Nightwalkers?</h2>
          <p className="text-gray-600 text-lg">
            Nightwalkers is a safety-first navigation platform built for New York City.
            It helps you walk home confidently at night by combining official data sources like NYC Open Data and NYPD crime reports with real-time community insights.
          </p>
        </div>
      </section>

      <HowItWorksCarousel />


      {/* Why Use Nightwalkers */}
      <section className="bg-gradient-to-b from-[#f3f8ff] to-white py-12 sm:py-14 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold tracking-tight text-center text-gray-900 mb-16">
            Why Use Night Walkers?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Safer Route Suggestions",
                description: "Compare standard and safer routes that avoid high-risk areas.",
                icon: ShieldCheck,
              },
              {
                title: "Real-Time Heatmaps",
                description: "Visualize nearby incident hotspots using up-to-date NYPD complaint data.",
                icon: MapPinned,
              },
              {
                title: "Community Forum",
                description: "Crowdsourced insights from other walkers in NYC — share tips or flag concerning areas.",
                icon: Users,
              },
              {
                title: "Private Mutual Chat",
                description: "Coordinate safe walk plans with mutuals using private messaging.",
                icon: MessageCircle,
              },
              {
                title: "Favorite Routes",
                description: "Save your go-to paths so you can access them quickly before heading out.",
                icon: Star,
              },
              {
                title: "Data-Driven Safety Insights",
                description:
                  "Safe routes are powered by NYC crime data. Future updates will include 311 complaints and infrastructure quality reports for even smarter navigation.",
                icon: LineChart,
              }              
            ].map((item, idx) => (
                <Card
                  key={idx}
                  className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl
                            hover:ring-1 hover:ring-blue-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                            transition-transform duration-200 ease-in-out"
                >

                <CardContent className="p-6 text-center flex flex-col items-center">
                  <item.icon className="text-blue-600 w-8 h-8 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-base">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Transparency */}
      <section className="bg-gradient-to-b from-[#f3f8ff] to-white py-12 sm:py-14 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Powered by Real Data
            </h2>
            <p className="text-gray-700 text-lg">
              We blend official NYC data and real-time user reports to give you accurate insights
              on where to walk - and where not to.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "NYC Open Data",
                description:
                  "Nightwalkers currently uses NYPD complaint data to highlight areas with frequent incidents. Support for 311 issues and infrastructure reports is planned for future updates.",
                icon: Database,
              },
              {
                title: "Community Reports",
                description:
                  "Posts, reactions, and replies help crowdsource dangerous spots others may miss.",
                icon: Megaphone,
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="bg-white/70 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-all rounded-xl"
              >
                <CardContent className="p-6 flex gap-4 items-start">
                <item.icon className="text-blue-600 w-8 h-8 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-base">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-[#f3f8ff] to-white py-12 sm:py-14 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold tracking-tight text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Disclosure key={idx}>
                {({ open }) => (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Disclosure.Button className={`w-full flex justify-between items-center px-5 py-4 text-left text-gray-800 font-medium transition-all
                                    hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                                    ${open ? "bg-gray-50" : "bg-white"}`}>
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                      {faq.answer}
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
