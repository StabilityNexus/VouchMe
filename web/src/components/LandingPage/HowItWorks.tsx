"use client";
import { UserPlus, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const HowItWorks = () => {
  const router = useRouter();

  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: "Create Request Page",
      description:
        "Set up your personalized testimonial request page with your address.",
      gradient: "from-indigo-500 to-purple-600",
      additionalContent: (
        <div
          className="mt-4 bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800/70 transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          <code className="text-indigo-400 text-sm">
            vouch.me/[your-address]
          </code>
        </div>
      ),
    },
    {
      number: "2",
      icon: FileText,
      title: "Create Signed Testimonials",
      description:
        "Testimonial givers can create and share signed testimonials via messaging apps or Waku.",
      gradient: "from-blue-400 to-blue-600",
      additionalContent: (
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="bg-gray-800/50 border border-gray-700/50 px-3 py-1 rounded-lg text-gray-300 text-sm">
            WhatsApp
          </span>
          <span className="bg-gray-800/50 border border-gray-700/50 px-3 py-1 rounded-lg text-gray-300 text-sm">
            Email
          </span>
          <span className="bg-gray-800/50 border border-gray-700/50 px-3 py-1 rounded-lg text-gray-300 text-sm">
            Waku
          </span>
        </div>
      ),
    },
    {
      number: "3",
      icon: CheckCircle,
      title: "Load & Showcase",
      description:
        "Load the signed testimonial onto your account to display it. Each testimonial is blockchain-secured.",
      gradient: "from-teal-400 to-teal-600",
      additionalContent: (
        <div className="mt-4 flex items-center gap-2 p-2 bg-gray-800/30 border border-gray-700/30 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-300 text-sm">Blockchain Verified</span>
        </div>
      ),
    },
  ];

  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(20,184,166,0.03),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
            How VouchMe
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              Works?
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Follow these simple steps to start requesting and showcasing
            verified testimonials
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative transition-all duration-1000"
              style={{
                transitionDelay: `${index * 150}ms`,
                cursor: index === 0 ? "pointer" : "default",
              }}
              onClick={
                index === 0 ? () => router.push("/dashboard") : undefined
              }
            >
              <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm z-10">
                {step.number}
              </div>

              <Card
                className={`bg-gray-900/50 border-gray-800/50 backdrop-blur-sm hover:bg-gray-900/70 hover:border-gray-700/50 transition-all duration-300 group h-full ${
                  index === 0 ? "hover:border-indigo-500/50" : ""
                }`}
              >
                <CardContent className="p-6 sm:p-8">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-indigo-400 transition-colors duration-200">
                    {step.title}
                  </h3>

                  <p className="text-gray-300 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {step.additionalContent}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
          >
            Start Requesting Testimonials
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
