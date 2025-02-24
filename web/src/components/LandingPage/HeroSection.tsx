import { Highlight } from "../ui/hero-highlight";

const HeroSection = () => {
  return (
    <div className="h-auto pt-20 pb-20 md:pb-48 bg-[#171717] flex flex-col items-center justify-center text-center px-4 py-16">
      <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 max-w-3xl !leading-tight">
        Build Trust Through Verified{" "}
        <Highlight className="text-black">Testimonials</Highlight>
      </h1>

      <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl">
        Collect, secure, and showcase authentic testimonials to enhance
        reputation and accelerate growth.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg  transition-colors font-bold">
          Start Collecting Testimonials
        </button>

        <button className="px-8 py-3 bg-transparent hover:bg-gray-800 text-white border border-gray-600 rounded-lg font-medium transition-colors">
          View Showcase
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
