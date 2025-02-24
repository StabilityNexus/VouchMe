import HeroSection from "@/components/LandingPage/HeroSection";
import Navbar from "@/components/LandingPage/Navbar";
import TestimonialsSection from "@/components/LandingPage/TestimonialSection";
import FeaturesSection from "@/components/LandingPage/FeaturesSection";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import Footer from "@/components/LandingPage/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <TestimonialsSection />
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}
