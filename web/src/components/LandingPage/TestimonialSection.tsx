"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { useContractStats } from "@/hooks/useContractStats";
import { useRouter } from "next/navigation";
import { Shield, Users, FileText, CheckCircle, Verified } from "lucide-react";

const TestimonialsSection = () => {
  const router = useRouter();
  const { profiles, testimonials } = useContractStats();

  return (
    <section
      id="testimonials"
      className="py-20 sm:py-32 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.03),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm mb-3">
              <Shield className="w-4 h-4 mr-2 text-indigo-400" />
              <span className="text-sm text-indigo-400 font-medium">
                Verified Testimonials
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-loose pb-2">
              Decentralized Testimonials for the
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 bg-clip-text text-transparent pb-1">
                Digital Age
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mt-2">
              Leverage blockchain technology to request, verify, and showcase
              authentic testimonials. Build trust with your audience through
              transparent and immutable proof of satisfaction.
            </p>

            {/* Animated Stats */}
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="text-center p-6 bg-gray-900/40 border border-gray-800/50 rounded-lg backdrop-blur-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <CountUp value={profiles} delay={500} />+
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  Total Users
                </div>
              </div>

              <div className="text-center p-6 bg-gray-900/40 border border-gray-800/50 rounded-lg backdrop-blur-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <CountUp value={testimonials} delay={500} />+
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  Total Testimonials
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Feature showcase */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-3xl" />
            <Card className="relative bg-gradient-to-br from-gray-900/60 to-gray-800/40 border-gray-700/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Cryptographically Secured
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Every testimonial is cryptographically signed and stored
                    on-chain, ensuring permanent authenticity and ownership.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "Immutable blockchain storage" },
                    { icon: CheckCircle, text: "Cryptographic verification" },
                    { icon: Verified, text: "Wallet-based authentication" },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30"
                    >
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-sm text-gray-300">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    Request Testimonial
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
