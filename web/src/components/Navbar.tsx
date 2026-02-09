"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import VouchMeLogo from "../image/VouchMeLogo.png";

const NAVY_BG = "#0B1C2D";
const SHEET_HEIGHT = "50vh"; // half page

const Navbar = ({
  toggleWalletConfig,
  useEnhancedConfig,
}: {
  toggleWalletConfig: () => void;
  useEnhancedConfig: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const { address } = useAccount();

  const isLanding = pathname === "/";
  const isAuth = !!address;

  /* Navbar background on scroll */
  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all ${
          scrolled
            ? "bg-black/80 backdrop-blur border-b border-gray-800"
            : "bg-transparent"
        }`}
      >
        <div className="h-20 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src={VouchMeLogo} alt="VouchMe" width={36} height={36} />
            <span className="text-white text-xl font-bold">VouchMe</span>
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-white p-2"
          >
            <Menu size={26} />
          </button>

          <div className="hidden md:flex">
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* HALF-SCREEN MENU SHEET */}
      {open && (
        <div
          className="fixed top-0 left-0 right-0 z-50 md:hidden shadow-2xl"
          style={{ height: SHEET_HEIGHT, backgroundColor: NAVY_BG }}
        >
          {/* HEADER */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
            <span className="text-white text-lg font-semibold">Menu</span>
            <button onClick={() => setOpen(false)} className="text-white">
              <X size={24} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="h-[calc(50vh-64px)] overflow-y-auto px-6 py-6 space-y-8 text-white">
            {/* NAV LINKS */}
            {isLanding && (
              <div className="space-y-4">
                <button
                  onClick={() => scrollTo("features")}
                  className="block w-full text-left text-base font-medium tracking-wide"
                >
                  Why VouchMe
                </button>
                <button
                  onClick={() => scrollTo("footer")}
                  className="block w-full text-left text-base font-medium tracking-wide"
                >
                  About Us
                </button>
              </div>
            )}

            {/* WALLET SECTION */}
            <div className="border-t border-white/10 pt-6">
              <div className="bg-white/5 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-sm opacity-80">Wallet</span>
                <ConnectButton />
              </div>
            </div>

            {/* CONFIG ACTION */}
            {!isAuth && (
              <button
                onClick={() => {
                  toggleWalletConfig();
                  setOpen(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-2xl font-semibold transition"
              >
                {useEnhancedConfig
                  ? "Disable ReOwn Wallets"
                  : "Enable ReOwn Wallets"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
