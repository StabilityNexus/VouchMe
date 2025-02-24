import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "John Doe",
      title: "Verified Client",
      content:
        "VouchMe has transformed how we collect and showcase client testimonials. The verification process adds an extra layer of trust.",
      avatarColor: "bg-blue-600",
    },
    {
      name: "Jane Smith",
      title: "Verified Client",
      content:
        "The blockchain-based verification system ensures authenticity. Our conversion rates have improved significantly.",
      avatarColor: "bg-purple-600",
    },
  ];

  return (
    <div className="bg-[#171717] text-white h-auto pb-24 md:pb-40 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold">
              Decentralized Testimonials for the Digital Age
            </h1>
            <p className="text-gray-300 text-lg md:text-xl">
              Leverage blockchain technology to collect, verify, and showcase
              authentic testimonials. Build trust with your audience through
              transparent and immutable proof of satisfaction.
            </p>
            <div>
              <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg  transition-colors font-bold">
                Create Collection
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-3xl" />
            <Card className="relative bg-gray-800/50 backdrop-blur border-gray-700">
              <CardContent className="p-6 space-y-4">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${testimonial.avatarColor}`}
                      />
                      <div>
                        <div className="font-bold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {testimonial.title}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300">{testimonial.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
