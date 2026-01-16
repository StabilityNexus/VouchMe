"use client";

import { useState, useEffect } from "react";
import { useReadContract, useChainId } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/utils/contract";
import VouchMeABI from "@/abis/VouchMe.json";

export function useContractStats() {
  const [stats, setStats] = useState({
    profiles: 120,
    testimonials: 259,
  });

  const chainId = useChainId();
  const contractAddress = CONTRACT_ADDRESSES[chainId];

  const { data: totalProfiles } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VouchMeABI.abi,
    functionName: "getTotalProfiles",
  });

  const { data: totalTestimonials } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VouchMeABI.abi,
    functionName: "getTotalTestimonials",
  });

  useEffect(() => {
    const contractProfiles = totalProfiles ? Number(totalProfiles) : 0;
    const contractTestimonials = totalTestimonials
      ? Number(totalTestimonials)
      : 0;

    setStats({
      profiles: contractProfiles > 150 ? contractProfiles : 150,
      testimonials: contractTestimonials > 250 ? contractTestimonials : 250,
    });
  }, [totalProfiles, totalTestimonials]);

  return stats;
}
