"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import VouchMeLogo from "../image/VouchMeLogo.png";

const Navbar = ({
  toggleWalletConfig,
  useEnhancedConfig,
}: {
  toggleWalletConfig: () => void;
  useEnhancedConfig: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { address } = useAccount();
  const pathname = usePathname();

  const isAuthenticated = !!address;
  const isLandingPage = pathname === "/";

  useEffect(() => {
    if (isLandingPage) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 50);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isLandingPage]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={
        isLandingPage
          ? `fixed top-0 w-full z-50 transition-all duration-300 ${
              isScrolled
                ? "bg-black/80 backdrop-blur-md border-b border-gray-800/50"
                : "bg-transparent"
            }`
          : "bg-[#171717]"
      }
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10">
              <Image
                src={VouchMeLogo}
                alt="VouchMe Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-white text-2xl font-bold">VouchMe</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLandingPage && (
              <>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-gray-300 hover:text-white transition-colors font-semibold"
                >
                  Why VouchMe
                </button>
                <button
                  onClick={() => scrollToSection("footer")}
                  className="text-gray-300 hover:text-white transition-colors font-semibold"
                >
                  About Us
                </button>
              </>
            )}

            {!isAuthenticated && (
              <button
                onClick={toggleWalletConfig}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {useEnhancedConfig
                  ? "Disable ReOwn Wallets"
                  : "Enable ReOwn Wallets"}
              </button>
            )}

            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-3">
              {isLandingPage && (
                <>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Why VouchMe
                  </button>
                  <button
                    onClick={() => scrollToSection("footer")}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </button>
                </>
              )}

              {!isLandingPage && isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                </>
              )}

              {!isAuthenticated && (
                <button
                  onClick={toggleWalletConfig}
                  className="block w-auto text-left px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  {useEnhancedConfig
                    ? "Disable ReOwn Wallets"
                    : "Enable ReOwn Wallets"}
                </button>
              )}

              <div className="py-2">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
