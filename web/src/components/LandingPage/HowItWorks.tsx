import React from "react";
import { Plus, Files, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: Plus,
      title: "Create Collection",
      description:
        "Set up your personalized testimonial collection page with your address.",
      additionalContent: (
        <div className="mt-4 bg-[#404040] rounded p-3">
          <code className="text-gray-400">vouch.me/[your-address]</code>
        </div>
      ),
    },
    {
      number: "2",
      icon: Files,
      title: "Create Signed Testimonials",
      description:
        "Testimonial givers can visit your link, create a signed testimonial, and share it directly with you via personal messaging apps.",
      additionalContent: (
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="bg-[#404040] px-3 py-1 rounded text-gray-300 text-sm">
            WhatsApp
          </span>
          <span className="bg-[#404040] px-3 py-1 rounded text-gray-300 text-sm">
            Email
          </span>
          <span className="bg-[#404040] px-3 py-1 rounded text-gray-300 text-sm">
            Direct Link
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
      additionalContent: (
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-300 text-sm">Blockchain Verified</span>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#171717] text-white py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How VouchMe Works?
          </h2>
          <p className="text-gray-400 text-xl md:text-lg font-medium">
            Follow these simple steps to start collecting and showcasing
            verified testimonials
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {step.number}
              </div>
              <Card className="bg-[#262626] border-gray-800 h-full">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center">
                      <step.icon size={24} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 mb-4">{step.description}</p>
                  {step.additionalContent}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg  transition-colors font-bold">
            Start Your Collection Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
