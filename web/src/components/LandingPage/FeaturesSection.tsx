"use client";

import { UserPlus, BarChart2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: UserPlus,
      title: "Easy to Request Testimonials",
      description:
        "Simple one-click process to submit verified testimonials through your personalized link.",
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      icon: BarChart2,
      title: "Analytics Dashboard",
      description:
        "Track performance metrics and gain insights from your testimonial collection.",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      icon: Shield,
      title: "Blockchain Verified",
      description:
        "Each testimonial is cryptographically signed and verified on the blockchain for authenticity.",
      gradient: "from-teal-400 to-teal-600",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 sm:py-32 bg-gradient-to-b from-black via-gray-900 to-gray-950 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.03),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
            VouchMe
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              Features
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need to request, verify, and showcase authentic
            testimonials on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="transition-all duration-1000"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm hover:bg-gray-900/70 hover:border-gray-700/50 transition-all duration-300 group h-full">
                <CardContent className="p-6 sm:p-8">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-indigo-400 transition-colors duration-200">
                    {feature.title}
                  </h3>

                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
