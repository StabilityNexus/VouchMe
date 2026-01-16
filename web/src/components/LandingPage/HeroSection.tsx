"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Shield, Lock, Users, ArrowRight } from "lucide-react";
import { Highlight } from "../ui/hero-highlight";

const HeroSection = () => {
  const router = useRouter();
  const { address } = useAccount();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-16 mb:pb-0 pb-10">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(251,191,36,0.05),transparent_50%)]" />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Shield
          className="absolute top-20 left-10 w-6 h-6 text-yellow-400/20 animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <Lock
          className="absolute top-40 right-20 w-4 h-4 text-yellow-400/30 animate-bounce"
          style={{ animationDelay: "2s" }}
        />
        <Users
          className="absolute bottom-40 left-20 w-5 h-5 text-yellow-400/20 animate-bounce"
          style={{ animationDelay: "4s" }}
        />
        <Shield
          className="absolute top-60 right-10 w-5 h-5 text-yellow-400/15 animate-bounce"
          style={{ animationDelay: "1s" }}
        />
        <Lock
          className="absolute bottom-20 right-40 w-4 h-4 text-yellow-400/25 animate-bounce"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="opacity-100">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 backdrop-blur-sm mb-5 md:mb-6">
            <Shield className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="text-xs sm:text-sm text-yellow-400 font-medium">
              Blockchain-Powered Testimonials
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-12 text-white">
            Build Trust Through
            <br />
            <span className="inline-block md:mt-3">
              <Highlight className="text-black">
                Verified Testimonials
              </Highlight>
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Request, secure, and showcase authentic testimonials to enhance
            reputation and accelerate growth through blockchain-verified proof
            of satisfaction.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-xl flex items-center justify-center"
            >
              Start Requesting Testimonials
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>

            <button
              onClick={() => router.push(`/testimonials?address=${address}`)}
              className={`w-full md:w-auto border border-indigo-400/30 text-indigo-400 hover:bg-indigo-400/10 hover:border-indigo-400/50 px-5 py-3 rounded-lg transition-all duration-200 `}
            >
              View Showcase
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { number: "100%", label: "Ownership" },
              { number: "∞", label: "Permanence" },
              { number: "0%", label: "Platform Risk" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2 group-hover:scale-110 transition-transform duration-200">
                  {stat.number}
                </div>
                <div className="text-sm sm:text-base text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
