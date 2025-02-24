import { Plus, BarChart2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: Plus,
      title: "Easy Collection",
      description:
        "Simple one-click process for people to leave verified testimonials through your personalized link.",
      iconBg: "bg-indigo-600",
    },
    {
      icon: BarChart2,
      title: "Analytics Dashboard",
      description:
        "Track performance metrics and gain insights from your testimonial collection.",
      iconBg: "bg-indigo-600",
    },
    {
      icon: Lock,
      title: "Secure Storage",
      description:
        "Your testimonials are securely stored and backed up on decentralized networks.",
      iconBg: "bg-indigo-600",
    },
  ];

  return (
    <div id="features" className="py-24 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="md:text-5xl text-3xl font-bold mb-4">
            VouchMe Features
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Everything you need to collect, verify, and showcase authentic
            testimonials on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 group"
            >
              <CardContent className="p-6">
                <div className="mb-6">
                  <div
                    className={`${feature.iconBg} w-12 h-12 rounded-lg flex items-center justify-center text-white 
                    transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 transition-colors duration-300 group-hover:text-blue-600">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 
                  transition-opacity duration-300 group-hover:opacity-100"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
