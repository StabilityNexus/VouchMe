"use client";
import { useState, useEffect } from "react";
import {
  Copy,
  CheckCircle,
  Loader2,
  Database,
  User,
  ExternalLink,
  Calendar,
  Shield,
  AlertTriangle,
  X,
  UserCheck,
  Mail,
  FileText,
  Wifi,
  WifiOff,
  Bell,
  MessageSquare,
  RefreshCw,
  Trash2,
  LayoutDashboard,
  Users,
  Save,
  Edit3,
  Share2,
  Linkedin,
  Send,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, VouchMeFactory } from "@/utils/contract";
import { useToast } from "@/hooks/useToast";
import { useWaku } from "@/hooks/useWaku";
import { TestimonialActionModal } from "@/components/ui/TestimonialActionModal";

// Extend Window interface for pendingWakuTestimonialId
declare global {
  interface Window {
    pendingWakuTestimonialId?: string | null;
  }
}

interface Testimonial {
  tokenId: number;
  content: string;
  fromAddress: string;
  giverName: string;
  profileUrl: string;
  timestamp: number;
  verified: boolean;
}

interface SignedTestimonial {
  senderAddress: string;
  receiverAddress: string;
  content: string;
  giverName: string;
  profileUrl: string;
  signature: string;
}

interface Profile {
  name: string;
  contact: string;
  bio: string;
}

export default function Dashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { showSuccess, showError } = useToast();
  const {
    isConnected: wakuConnected,
    isConnecting: wakuConnecting,
    receivedTestimonials: wakuTestimonials,
    notifications,
    clearNotifications,
    removeTestimonial,
    refreshTestimonials,
    isRefreshing,
  } = useWaku();

  // Message constants for sharing
  const TESTIMONIAL_REQUEST_MESSAGE =
    "Hi! I'd love to get your feedback. You can share your testimonial here:";
  const SHOWCASE_MESSAGE =
    "Check out my testimonials and recommendations here:";

  // State declarations - activeView must be declared before useEffect that uses it
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState("");
  const [copied, setCopied] = useState(false);
  const [showcaseCopied, setShowcaseCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTestimonials, setIsFetchingTestimonials] = useState(false);
  const [baseUrl, setBaseUrl] = useState("vouchme.stability.nexus");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    contact: "",
    bio: "",
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [pendingTestimonial, setPendingTestimonial] =
    useState<SignedTestimonial | null>(null);
  const [existingTestimonial, setExistingTestimonial] =
    useState<Testimonial | null>(null);
  const [activeView, setActiveView] = useState<
    "dashboard" | "received" | "profile"
  >("dashboard");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempProfile, setTempProfile] = useState<Profile>({
    name: "",
    contact: "",
    bio: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    contact?: string;
    bio?: string;
  }>({});

  // Delete testimonial modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    testimonial: Testimonial | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    testimonial: null,
    isLoading: false,
  });

  // Testimonial action modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    action: "reject";
    testimonial: {
      id: string;
      giverName: string;
      senderAddress: string;
      receiverAddress: string;
      content: string;
      profileUrl: string;
      signature: string;
    } | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    action: "reject",
    testimonial: null,
    isLoading: false,
  });

  // Share dropdown states
  const [showRequestShareMenu, setShowRequestShareMenu] = useState(false);
  const [showShowcaseShareMenu, setShowShowcaseShareMenu] = useState(false);

  // Auto-refresh tracking for first visit to received section
  const [hasAutoRefreshedOnFirstVisit, setHasAutoRefreshedOnFirstVisit] =
    useState(false);

  useEffect(() => {
    console.log("Dashboard: wakuTestimonials updated:", wakuTestimonials);
    console.log("Dashboard: wakuTestimonials count:", wakuTestimonials.length);
    console.log("Dashboard: wakuTestimonials array:", wakuTestimonials);
    console.log("Dashboard: wakuConnected:", wakuConnected);
    console.log("Dashboard: activeView:", activeView);
  }, [wakuTestimonials, wakuConnected, activeView]);

  // Auto-refresh testimonials once when user first visits received section
  useEffect(() => {
    if (
      wakuConnected &&
      !hasAutoRefreshedOnFirstVisit &&
      activeView === "received"
    ) {
      console.log(
        "Dashboard: Auto-refreshing testimonials on first visit to received section"
      );
      const autoRefresh = async () => {
        try {
          await refreshTestimonials();
          setLastRefreshed(new Date());
          setHasAutoRefreshedOnFirstVisit(true);
        } catch (error) {
          console.error("Auto-refresh on first visit failed:", error);
        }
      };
      autoRefresh();
    }
  }, [
    wakuConnected,
    hasAutoRefreshedOnFirstVisit,
    activeView,
    refreshTestimonials,
  ]);

  // Custom refresh handler that updates timestamp
  const handleRefresh = async () => {
    try {
      await refreshTestimonials();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  // Helper function to get domain info from URL
  const getDomainInfo = (url: string) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      if (domain.includes("linkedin.com"))
        return {
          name: "LinkedIn",
          bgClass: "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30",
        };
      if (domain.includes("github.com"))
        return {
          name: "GitHub",
          bgClass: "bg-gray-600/20 text-gray-300 hover:bg-gray-600/30",
        };
      if (domain.includes("twitter.com") || domain.includes("x.com"))
        return {
          name: "Twitter",
          bgClass: "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30",
        };
      if (domain.includes("portfolio") || domain.includes("personal"))
        return {
          name: "Portfolio",
          bgClass: "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30",
        };
      return {
        name: "Profile",
        bgClass: "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30",
      };
    } catch {
      return {
        name: "Profile",
        bgClass: "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30",
      };
    }
  };

  const CONTRACT_ADDRESS =
    CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[534351];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin.replace(/^https?:\/\//, ""));
    }
  }, []);

  const shareableLink = `${baseUrl}/write?address=${address}`;
  useEffect(() => {
    const fetchTestimonials = async () => {
      if (!address) return;

      try {
        setIsFetchingTestimonials(true);
        const ethereum = window.ethereum;
        if (!ethereum) return;

        const provider = new ethers.BrowserProvider(ethereum);
        // Use TypeChain factory to create a typed contract instance
        const contract = VouchMeFactory.connect(CONTRACT_ADDRESS, provider);

        // Type-safe method call
        const testimonialIds = await contract.getReceivedTestimonials(address);

        if (!testimonialIds || testimonialIds.length === 0) {
          setTestimonials([]);
          return;
        }

        const details = await Promise.all(
          testimonialIds.map((id) => contract.getTestimonialDetails(id))
        );

        const formattedTestimonials = details.map((detail, index) => ({
          tokenId: Number(testimonialIds[index]),
          content: detail.content,
          fromAddress: detail.sender,
          giverName: detail.giverName,
          profileUrl: detail.profileUrl,
          timestamp: Number(detail.timestamp),
          verified: detail.verified,
        }));
        setTestimonials(formattedTestimonials);
        // Only show success toast if testimonials are actually loaded
        if (formattedTestimonials.length > 0) {
          showSuccess(
            `Successfully loaded ${formattedTestimonials.length} testimonials`
          );
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        showError("Failed to fetch testimonials");
      } finally {
        setIsFetchingTestimonials(false);
      }
    };

    fetchTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, CONTRACT_ADDRESS]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) {
        setIsProfileLoading(false);
        return;
      }

      try {
        setIsProfileLoading(true);

        // Small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 200));

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = VouchMeFactory.connect(CONTRACT_ADDRESS, provider);

        const userProfile = await contract.userProfiles(address);

        setProfile({
          name: userProfile.name,
          contact: userProfile.contact,
          bio: userProfile.bio,
        });
        setTempProfile({
          name: userProfile.name,
          contact: userProfile.contact,
          bio: userProfile.bio,
        });

        // Check if profile is incomplete and show modal after a delay
        const isIncomplete =
          !userProfile.name || !userProfile.contact || !userProfile.bio;
        if (isIncomplete) {
          // Delay showing the modal to prevent flash on page load
          setTimeout(() => {
            setShowProfileModal(true);
          }, 1000); // Show after 1 second
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Don't show modal if there's an error fetching profile
        setProfile({ name: "", contact: "", bio: "" });
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (address) {
      fetchProfile();
    }
  }, [address, CONTRACT_ADDRESS]);

  const handleDismissProfileModal = () => {
    setShowProfileModal(false);
  };

  // Profile Completion Modal Component
  const ProfileCompletionModal = () => {
    if (!showProfileModal) return null;

    // Show loading state while fetching profile
    if (isProfileLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2a2a2a] rounded-lg max-w-md w-full p-6 relative">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Checking Profile...
              </h2>
              <p className="text-gray-400 text-sm">
                Please wait while we load your profile information
              </p>
            </div>
          </div>
        </div>
      );
    }

    const getCompletionStatus = () => {
      const total = 3;
      const completed = [profile.name, profile.contact, profile.bio].filter(
        Boolean
      ).length;
      return {
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
      };
    };

    const status = getCompletionStatus();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-[#2a2a2a] rounded-lg max-w-md w-full p-6 relative">
          {/* Close button */}
          <button
            onClick={handleDismissProfileModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-400 text-sm">
              Help others know who you are by completing your profile
              information
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Profile Completion</span>
              <span className="text-sm text-indigo-400">
                {status.percentage}%
              </span>
            </div>
            <div className="w-full bg-[#3a3a3a] rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {status.completed} of {status.total} sections completed
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              {profile.name ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <UserCheck className="w-5 h-5 text-gray-400" />
              )}
              <span
                className={`text-sm ${
                  profile.name ? "text-green-400" : "text-gray-400"
                }`}
              >
                Display Name
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {profile.contact ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <Mail className="w-5 h-5 text-gray-400" />
              )}
              <span
                className={`text-sm ${
                  profile.contact ? "text-green-400" : "text-gray-400"
                }`}
              >
                Contact Information
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {profile.bio ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <FileText className="w-5 h-5 text-gray-400" />
              )}
              <span
                className={`text-sm ${
                  profile.bio ? "text-green-400" : "text-gray-400"
                }`}
              >
                Bio Description
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleDismissProfileModal}
              className="flex-1 px-4 py-2 bg-[#3a3a3a] text-gray-300 rounded-lg hover:bg-[#4a4a4a] transition-colors text-sm"
            >
              Later
            </button>
            <button
              onClick={() => {
                setActiveView("profile");
                handleDismissProfileModal();
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm text-center"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleAddTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTestimonial.trim() || !address) return;

    try {
      setIsLoading(true);
      let signedData: SignedTestimonial;
      try {
        signedData = JSON.parse(newTestimonial);
      } catch {
        showError("Invalid testimonial format. Please paste a valid JSON.");
        setIsLoading(false);
        return;
      }

      // Check if testimonial from this sender already exists
      const existingFromSender = testimonials.find(
        (testimonial) =>
          testimonial.fromAddress.toLowerCase() ===
          signedData.senderAddress.toLowerCase()
      );

      if (existingFromSender) {
        // Show confirmation modal
        setPendingTestimonial(signedData);
        setExistingTestimonial(existingFromSender);
        setShowDuplicateModal(true);
        setIsLoading(false);
        return;
      }

      // If no duplicate, proceed with adding testimonial
      await addTestimonialToBlockchain(signedData);
    } catch (error) {
      console.error("Error adding testimonial:", error);
      showError("Error adding testimonial. Please try again.");
      setIsLoading(false);
    }
  };

  const addTestimonialToBlockchain = async (signedData: SignedTestimonial) => {
    try {
      setIsLoading(true);
      const ethereum = window.ethereum;

      if (!ethereum) {
        console.error("No Ethereum provider found");
        showError("No Ethereum provider found. Please install a wallet.");
        return;
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const contract = VouchMeFactory.connect(CONTRACT_ADDRESS, provider);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.createTestimonial(
        signedData.senderAddress,
        signedData.content,
        signedData.giverName,
        signedData.profileUrl,
        signedData.signature
      );

      console.log("Transaction sent:", tx.hash);

      setNewTestimonial(""); // Wait for transaction confirmation
      await tx.wait();
      showSuccess("Testimonial added successfully.");

      // Refresh testimonials
      if (address) {
        const testimonialIds = await contract.getReceivedTestimonials(address);

        if (testimonialIds && testimonialIds.length > 0) {
          const details = await Promise.all(
            testimonialIds.map((id) => contract.getTestimonialDetails(id))
          );

          const formattedTestimonials = details.map((detail, index) => ({
            tokenId: Number(testimonialIds[index]),
            content: detail.content,
            fromAddress: detail.sender,
            giverName: detail.giverName,
            profileUrl: detail.profileUrl,
            timestamp: Number(detail.timestamp),
            verified: detail.verified,
          }));

          setTestimonials(formattedTestimonials);
        }
      }
    } catch (error) {
      console.error("Error adding testimonial:", error);
      showError("Error adding testimonial. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReplace = async () => {
    if (pendingTestimonial) {
      setShowDuplicateModal(false);
      await addTestimonialToBlockchain(pendingTestimonial);
      setPendingTestimonial(null);
      setExistingTestimonial(null);

      // If this came from Waku testimonial acceptance, remove it from pending list
      if (window.pendingWakuTestimonialId) {
        removeTestimonial(window.pendingWakuTestimonialId);
        window.pendingWakuTestimonialId = null;
        showSuccess(
          "Testimonial accepted, added to blockchain, and removed from pending list"
        );
      }
    }
  };

  const handleCancelReplace = () => {
    setShowDuplicateModal(false);
    setPendingTestimonial(null);
    setExistingTestimonial(null);
    setIsLoading(false);

    // Clean up pending Waku testimonial ID
    if (window.pendingWakuTestimonialId) {
      window.pendingWakuTestimonialId = null;
    }
  };

  // Delete testimonial function
  const handleDeleteTestimonial = async (testimonial: Testimonial) => {
    try {
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));

      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = VouchMeFactory.connect(CONTRACT_ADDRESS, signer);

      // Call the deleteTestimonial function with the token ID
      const tx = await contract.deleteTestimonial(testimonial.tokenId);
      await tx.wait();

      // Remove from local state
      setTestimonials((prev) =>
        prev.filter((t) => t.tokenId !== testimonial.tokenId)
      );

      // Close modal
      setDeleteModal({
        isOpen: false,
        testimonial: null,
        isLoading: false,
      });

      showSuccess("Testimonial deleted successfully");
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showError("Failed to delete testimonial. Please try again.");
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Function to truncate address/text
  const truncateText = (text: string, startLength = 6, endLength = 4) => {
    if (!text) return "";
    if (text.length <= startLength + endLength) return text;
    return `${text.slice(0, startLength)}...${text.slice(-endLength)}`;
  };

  // Function to truncate links for better display (show more context)
  const truncateLink = (text: string, maxLength: number = 50) => {
    if (!text || text.length <= maxLength) return text;

    // For URLs with address parameter, keep the meaningful part and truncate only the address
    if (text.includes("?address=")) {
      const [baseUrl, addressParam] = text.split("?address=");
      if (baseUrl && addressParam) {
        // Keep the base URL + "?address=" and truncate the address value
        const prefix = `${baseUrl}?address=`;
        const remainingSpace = maxLength - prefix.length - 3; // 3 for "..."

        if (remainingSpace > 6) {
          // Ensure we have space for meaningful truncation
          const startLength = Math.max(3, Math.floor(remainingSpace * 0.3)); // Show less of start
          const endLength = Math.max(3, remainingSpace - startLength);
          const truncatedAddress = `${addressParam.slice(
            0,
            startLength
          )}...${addressParam.slice(-endLength)}`;
          return `${prefix}${truncatedAddress}`;
        }
      }
    }

    // Fallback to general truncation
    const startLength = Math.floor(maxLength * 0.7);
    const endLength = maxLength - startLength - 3; // 3 for "..."
    return `${text.slice(0, startLength)}...${text.slice(-endLength)}`;
  };
  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShowcaseLink = () => {
    const showcaseLink = `${window.location.origin}/testimonials?address=${address}`;
    navigator.clipboard.writeText(showcaseLink);
    setShowcaseCopied(true);
    setTimeout(() => setShowcaseCopied(false), 2000);
  };

  // Social media sharing functions
  const shareOnX = (url: string, text: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const shareOnLinkedIn = (url: string) => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const shareOnWhatsApp = (url: string, text: string) => {
    const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
      `${text} ${url}`
    )}`;
    window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
  };

  const shareViaEmail = (url: string, subject: string, body: string) => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(`${body}\n\n${url}`)}`;
    window.open(emailUrl);
  };

  // loading skeleton for testimonials
  const TestimonialsSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#2a2a2a] rounded-xl p-6 overflow-hidden relative"
        >
          <div className="animate-pulse">
            {/* Content shimmer */}
            <div className="h-4 bg-[#3a3a3a] rounded w-full mb-3"></div>
            <div className="h-4 bg-[#3a3a3a] rounded w-[90%] mb-3"></div>
            <div className="h-4 bg-[#3a3a3a] rounded w-[75%] mb-8"></div>

            {/* Footer shimmer */}
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#3a3a3a]"></div>
                <div className="h-3 bg-[#3a3a3a] rounded w-24"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 bg-[#3a3a3a] rounded w-16"></div>
                <div className="h-3 bg-[#3a3a3a] rounded w-16"></div>
              </div>
            </div>
          </div>
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shine"></div>
        </div>
      ))}
    </>
  );

  // loading skeleton for stats card
  const StatsCardSkeleton = () => (
    <div className="bg-gradient-to-br from-indigo-600/70 to-indigo-700/70 rounded-xl p-6 flex items-center justify-between relative overflow-hidden">
      <div className="animate-pulse">
        <div className="h-5 bg-white/20 rounded w-32 mb-3"></div>
        <div className="h-8 bg-white/20 rounded w-16"></div>
      </div>
      <div className="h-16 w-16 bg-white/10 rounded-full animate-pulse"></div>
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shine"></div>
    </div>
  );

  // Profile validation functions
  const validateField = (field: keyof Profile, value: string): string => {
    if (!value.trim()) {
      switch (field) {
        case "name":
          return "Name is required";
        case "contact":
          return "Contact information is required";
        case "bio":
          return "Bio is required";
        default:
          return "This field is required";
      }
    }
    return "";
  };

  const validateAllFields = (): boolean => {
    const newErrors: { name?: string; contact?: string; bio?: string } = {};
    newErrors.name = validateField("name", tempProfile.name);
    newErrors.contact = validateField("contact", tempProfile.contact);
    newErrors.bio = validateField("bio", tempProfile.bio);

    setErrors(newErrors);
    return !newErrors.name && !newErrors.contact && !newErrors.bio;
  };

  const isFormValid = (): boolean => {
    return (
      tempProfile.name.trim() !== "" &&
      tempProfile.contact.trim() !== "" &&
      tempProfile.bio.trim() !== ""
    );
  };

  // Profile management functions
  const handleEdit = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setErrors({});
    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!address) return;

    if (!validateAllFields()) {
      showError("Please fill in all required fields correctly");
      return;
    }

    try {
      setIsSaving(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = VouchMeFactory.connect(CONTRACT_ADDRESS, signer);

      const tx = await contract.setProfile(
        tempProfile.name.trim(),
        tempProfile.contact.trim(),
        tempProfile.bio.trim()
      );

      await tx.wait();

      setProfile({ ...tempProfile });
      setIsEditing(false);
      setErrors({});
      showSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      showError("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    setTempProfile({ ...tempProfile, [field]: value });

    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 min-h-screen bg-[#171717] border-r border-[#3a3a3a] flex flex-col">
          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeView === "dashboard"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => setActiveView("received")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative ${
                  activeView === "received"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Received Testimonials</span>
                {wakuTestimonials.length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {wakuTestimonials.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveView("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeView === "profile"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* Notifications Header */}
          {notifications.length > 0 && (
            <div className="mb-6 bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full text-sm font-medium">
                    {notifications.length} new
                  </span>
                  <button
                    onClick={clearNotifications}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-300">
                        New testimonial from{" "}
                        <span className="font-semibold">
                          {notification.giverName}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{notifications.length - 3} more notifications
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Content Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">
              {activeView === "dashboard"
                ? "Dashboard Overview"
                : activeView === "received"
                ? "Received Testimonials"
                : "Profile Settings"}
            </h1>
            <p className="text-gray-400 mt-1">
              {activeView === "dashboard"
                ? "Manage your testimonials and Testimonial request links"
                : activeView === "received"
                ? "Review testimonials received via Waku network"
                : "Manage your profile information"}
            </p>
          </div>

          {/* View Content */}
          {activeView === "dashboard" && (
            <div>
              {/* Dashboard Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Testimonials Card */}
                {isFetchingTestimonials ? (
                  <StatsCardSkeleton />
                ) : (
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Database className="w-6 h-6" />
                        </div>
                        <CheckCircle className="w-8 h-8 text-white/60" />
                      </div>
                      <div className="text-3xl font-bold mb-1">
                        {testimonials.length}
                      </div>
                      <div className="text-indigo-100 text-sm font-medium">
                        Total Testimonials
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Reviews Card */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <Bell className="w-8 h-8 text-white/60" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {wakuTestimonials.length}
                    </div>
                    <div className="text-amber-100 text-sm font-medium">
                      Pending Reviews
                    </div>
                  </div>
                </div>

                {/* Connection Status Card */}
                <div
                  className={`rounded-xl p-6 text-white relative overflow-hidden ${
                    wakuConnected
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : wakuConnecting
                      ? "bg-gradient-to-br from-amber-500 to-orange-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        {wakuConnected ? (
                          <Wifi className="w-6 h-6" />
                        ) : wakuConnecting ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <WifiOff className="w-6 h-6" />
                        )}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          wakuConnected
                            ? "bg-green-200 animate-pulse"
                            : wakuConnecting
                            ? "bg-amber-200 animate-pulse"
                            : "bg-red-200"
                        }`}
                      />
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {wakuConnected
                        ? "Connected"
                        : wakuConnecting
                        ? "Connecting..."
                        : "Offline"}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        wakuConnecting
                          ? "text-amber-100"
                          : wakuConnected
                          ? "text-green-100"
                          : "text-red-100"
                      }`}
                    >
                      Waku Network
                    </div>
                  </div>
                </div>

                {/* Profile Completion Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <UserCheck className="w-8 h-8 text-white/60" />
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {Math.round(
                        ([profile.name, profile.contact, profile.bio].filter(
                          Boolean
                        ).length /
                          3) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-purple-100 text-sm font-medium">
                      Profile Complete
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section - Redesigned */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Quick Actions
                    </h3>
                    <p className="text-sm text-gray-400">
                      Manage your links and testimonials
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Share Links Card */}
                  <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          Share Your Links
                        </h4>
                        <p className="text-sm text-gray-400">
                          Testimonial Request and showcase links
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Request Link */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">
                          Testimonial Request Link
                        </label>
                        <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#3a3a3a]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 font-mono text-sm text-gray-300 overflow-hidden">
                              {truncateLink(shareableLink)}
                            </div>
                            <button
                              onClick={copyLink}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                                copied
                                  ? "bg-green-600 text-white"
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105"
                              }`}
                            >
                              {copied ? (
                                <CheckCircle size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                              <span className="text-sm">
                                {copied ? "Copied!" : "Copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            Share this link to request testimonials from others
                          </p>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowRequestShareMenu(!showRequestShareMenu)
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            >
                              <Share2 size={12} />
                              Share
                            </button>
                            {showRequestShareMenu && (
                              <div className="absolute right-0 top-8 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-lg z-10 p-3 min-w-[160px]">
                                <div className="flex items-center justify-center gap-4">
                                  <button
                                    onClick={() => {
                                      shareOnX(
                                        shareableLink,
                                        TESTIMONIAL_REQUEST_MESSAGE
                                      );
                                      setShowRequestShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-all duration-200 hover:scale-110"
                                    title="Share on X"
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="text-white"
                                    >
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareOnLinkedIn(shareableLink);
                                      setShowRequestShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 transition-all duration-200 hover:scale-110"
                                    title="Share on LinkedIn"
                                  >
                                    <Linkedin
                                      size={18}
                                      className="text-blue-400"
                                    />
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareOnWhatsApp(
                                        shareableLink,
                                        TESTIMONIAL_REQUEST_MESSAGE
                                      );
                                      setShowRequestShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-green-500/20 hover:bg-green-500/40 transition-all duration-200 hover:scale-110"
                                    title="Share on WhatsApp"
                                  >
                                    <Send
                                      size={18}
                                      className="text-green-400"
                                    />
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareViaEmail(
                                        shareableLink,
                                        "Request for Testimonial",
                                        TESTIMONIAL_REQUEST_MESSAGE
                                      );
                                      setShowRequestShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-gray-500/20 hover:bg-gray-500/40 transition-all duration-200 hover:scale-110"
                                    title="Share via Email"
                                  >
                                    <Mail size={18} className="text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Showcase Link */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">
                          Showcase Link
                        </label>
                        <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#3a3a3a]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 font-mono text-sm text-gray-300 overflow-hidden">
                              {truncateLink(
                                `${baseUrl}/testimonials?address=${address}`
                              )}
                            </div>
                            <button
                              onClick={copyShowcaseLink}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                                showcaseCopied
                                  ? "bg-green-600 text-white"
                                  : "bg-teal-600 hover:bg-teal-700 text-white hover:scale-105"
                              }`}
                            >
                              {showcaseCopied ? (
                                <CheckCircle size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                              <span className="text-sm">
                                {showcaseCopied ? "Copied!" : "Copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            Share this link to showcase your testimonials
                            publicly
                          </p>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowShowcaseShareMenu(!showShowcaseShareMenu)
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                            >
                              <Share2 size={12} />
                              Share
                            </button>
                            {showShowcaseShareMenu && (
                              <div className="absolute right-0 top-8 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-lg z-10 p-3 min-w-[160px]">
                                <div className="flex items-center justify-center gap-4">
                                  <button
                                    onClick={() => {
                                      shareOnX(
                                        `${baseUrl}/testimonials?address=${address}`,
                                        SHOWCASE_MESSAGE
                                      );
                                      setShowShowcaseShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-all duration-200 hover:scale-110"
                                    title="Share on X"
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="text-white"
                                    >
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareOnLinkedIn(
                                        `${baseUrl}/testimonials?address=${address}`
                                      );
                                      setShowShowcaseShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 transition-all duration-200 hover:scale-110"
                                    title="Share on LinkedIn"
                                  >
                                    <Linkedin
                                      size={18}
                                      className="text-blue-400"
                                    />
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareOnWhatsApp(
                                        `${baseUrl}/testimonials?address=${address}`,
                                        SHOWCASE_MESSAGE
                                      );
                                      setShowShowcaseShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-green-500/20 hover:bg-green-500/40 transition-all duration-200 hover:scale-110"
                                    title="Share on WhatsApp"
                                  >
                                    <Send
                                      size={18}
                                      className="text-green-400"
                                    />
                                  </button>
                                  <button
                                    onClick={() => {
                                      shareViaEmail(
                                        `${baseUrl}/testimonials?address=${address}`,
                                        "My Testimonials and Recommendations",
                                        SHOWCASE_MESSAGE
                                      );
                                      setShowShowcaseShareMenu(false);
                                    }}
                                    className="flex items-center justify-center p-3 rounded-lg bg-gray-500/20 hover:bg-gray-500/40 transition-all duration-200 hover:scale-110"
                                    title="Share via Email"
                                  >
                                    <Mail size={18} className="text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Testimonial Card */}
                  <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          Add Testimonial
                        </h4>
                        <p className="text-sm text-gray-400">
                          Manually add signed testimonials
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddTestimonial} className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={newTestimonial}
                          onChange={(e) => setNewTestimonial(e.target.value)}
                          placeholder="Paste your signed testimonial data here...&#10;&#10;This should be the complete JSON testimonial object including signature, sender address, content, and other required fields."
                          rows={6}
                          className="w-full bg-[#1f1f1f] rounded-lg p-4 text-white border border-[#3a3a3a] focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors placeholder-gray-500 resize-none"
                        />
                        {newTestimonial && (
                          <div className="absolute top-3 right-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !newTestimonial.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-4 rounded-lg font-medium transition-all hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing Testimonial...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Add to Blockchain
                          </div>
                        )}
                      </button>
                    </form>

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300">
                        <strong>Tip:</strong>{" "}
                        {wakuConnected
                          ? "Testimonials received via Waku are processed automatically"
                          : "Connect to Waku network for automatic testimonial processing"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Testimonials Section */}
              <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                {/* Section Header */}
                <div className="bg-[#1f1f1f] border-b border-[#3a3a3a] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        My Testimonials
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Verified testimonials on the blockchain
                      </p>
                    </div>
                    {isFetchingTestimonials && (
                      <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 py-2 px-4 rounded-full border border-indigo-500/20">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm font-medium">Syncing</span>
                        <Database size={14} className="animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimonials Content */}
                <div className="p-6">
                  {isFetchingTestimonials ? (
                    <TestimonialsSkeleton />
                  ) : testimonials.length > 0 ? (
                    <div className="space-y-4">
                      {testimonials.map((testimonial, index) => (
                        <div
                          key={index}
                          className="bg-[#1f1f1f] rounded-xl p-6 border border-[#3a3a3a] fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                                    <User size={20} className="text-white" />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1f1f1f]">
                                    <Shield size={10} className="text-white" />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-bold text-white text-lg mb-1">
                                    {testimonial.giverName || "Anonymous User"}
                                  </h3>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-mono text-gray-400 bg-[#2a2a2a] px-2 py-1 rounded-md">
                                      {truncateText(testimonial.fromAddress)}
                                    </span>
                                    {testimonial.profileUrl && (
                                      <a
                                        href={testimonial.profileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                                          getDomainInfo(testimonial.profileUrl)
                                            .bgClass
                                        }`}
                                      >
                                        <ExternalLink size={11} />
                                        {
                                          getDomainInfo(testimonial.profileUrl)
                                            .name
                                        }
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-300">
                                    {new Date(
                                      testimonial.timestamp * 1000
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      testimonial.timestamp * 1000
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      isOpen: true,
                                      testimonial: testimonial,
                                      isLoading: false,
                                    })
                                  }
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all hover:scale-110"
                                  title="Delete testimonial"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="mb-4">
                              <div className="bg-[#2a2a2a] rounded-lg p-4 border-l-4 border-indigo-500">
                                <p className="text-gray-200 leading-relaxed text-lg">
                                  &ldquo;{testimonial.content}&rdquo;
                                </p>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-[#3a3a3a]">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Shield size={14} className="text-green-400" />
                                <span>Verified</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} />
                                <span>
                                  {new Date(
                                    testimonial.timestamp * 1000
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        No testimonials yet
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Share your testimonial request link to start receiving
                        testimonials from colleagues and clients.
                      </p>
                      <button
                        onClick={copyLink}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 shadow-md"
                      >
                        <div className="flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                          Copy Request Link
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Received Testimonials View */}
          {activeView === "received" && (
            <div>
              {/* Header Stats */}
              <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400">
                        {wakuTestimonials.length}
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                    <div className="h-12 w-px bg-[#3a3a3a]"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {testimonials.length}
                      </div>
                      <div className="text-sm text-gray-400">Approved</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRefresh}
                      disabled={
                        isRefreshing || (wakuConnecting && !wakuConnected)
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isRefreshing || (wakuConnecting && !wakuConnected)
                          ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105"
                      }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      {isRefreshing ? "Syncing..." : "Refresh"}
                    </button>

                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        wakuConnected
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : wakuConnecting
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {wakuConnected ? (
                        <Wifi className="w-4 h-4" />
                      ) : wakuConnecting ? (
                        <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      ) : (
                        <WifiOff className="w-4 h-4" />
                      )}
                      {wakuConnected
                        ? "Connected"
                        : wakuConnecting
                        ? "Connecting..."
                        : "Offline"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isRefreshing && (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-8 mb-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-8 h-8 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        Syncing with Waku Network
                      </div>
                      <div className="text-sm text-gray-400">
                        Fetching latest testimonials...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {wakuTestimonials.length === 0 && !isRefreshing ? (
                <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-12 text-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No pending testimonials
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    When someone sends you a testimonial via Waku network, it
                    will appear here for review.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    {wakuConnected ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 font-medium">
                          Connected and listening
                        </span>
                      </>
                    ) : wakuConnecting ? (
                      <>
                        <div className="w-2 h-2 border border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        <span className="text-amber-400 font-medium">
                          Connecting to network...
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-red-400 font-medium">
                          Connection required
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : wakuTestimonials.length > 0 ? (
                <div>
                  {/* Success message after refresh */}
                  {lastRefreshed && wakuTestimonials.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          Found {wakuTestimonials.length} testimonial
                          {wakuTestimonials.length !== 1 ? "s" : ""} in Waku
                          Store
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Testimonials Grid */}
                  <div className="space-y-4">
                    {wakuTestimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="bg-[#2a2a2a] rounded-lg p-6 border border-[#3a3a3a]"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#3a3a3a] flex items-center justify-center">
                              <User size={18} className="text-gray-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                {testimonial.giverName || "Anonymous User"}
                              </h3>
                              <span className="text-xs text-gray-400 font-mono bg-[#1f1f1f] px-2 py-1 rounded">
                                {truncateText(testimonial.senderAddress)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                              Pending
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(
                                testimonial.timestamp
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mb-4">
                          <p className="text-gray-200 leading-relaxed">
                            &ldquo;{testimonial.content}&rdquo;
                          </p>
                        </div>

                        {/* Profile URL if available */}
                        {testimonial.profileUrl && (
                          <div className="mb-4">
                            <a
                              href={testimonial.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <ExternalLink size={14} />
                              View Profile
                            </a>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-[#3a3a3a]">
                          <button
                            onClick={() => {
                              setActionModal({
                                isOpen: true,
                                action: "reject",
                                testimonial: testimonial,
                                isLoading: false,
                              });
                            }}
                            className="flex-1 bg-[#3a3a3a] hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Reject
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // Check for existing testimonial from same sender
                                const existingFromSender = testimonials.find(
                                  (t) =>
                                    t.fromAddress.toLowerCase() ===
                                    testimonial.senderAddress.toLowerCase()
                                );

                                if (existingFromSender) {
                                  // Show duplicate confirmation modal
                                  setPendingTestimonial({
                                    senderAddress: testimonial.senderAddress,
                                    receiverAddress:
                                      testimonial.receiverAddress,
                                    content: testimonial.content,
                                    giverName: testimonial.giverName,
                                    profileUrl: testimonial.profileUrl,
                                    signature: testimonial.signature,
                                  });
                                  setExistingTestimonial(existingFromSender);
                                  setShowDuplicateModal(true);

                                  // Store the waku testimonial ID for removal after acceptance
                                  window.pendingWakuTestimonialId =
                                    testimonial.id;
                                  return;
                                }

                                // No duplicate, proceed directly
                                await addTestimonialToBlockchain({
                                  senderAddress: testimonial.senderAddress,
                                  receiverAddress: testimonial.receiverAddress,
                                  content: testimonial.content,
                                  giverName: testimonial.giverName,
                                  profileUrl: testimonial.profileUrl,
                                  signature: testimonial.signature,
                                });

                                // Remove from pending list after successful blockchain addition
                                removeTestimonial(testimonial.id);
                                showSuccess(
                                  "Testimonial accepted and added to blockchain"
                                );
                              } catch (error) {
                                console.error(
                                  "Failed to accept testimonial:",
                                  error
                                );
                                showError(
                                  "Failed to accept testimonial. Please try again."
                                );
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Profile View */}
          {activeView === "profile" && (
            <div>
              {/* Profile Card */}
              <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                {/* Profile Header */}
                <div className="bg-[#1f1f1f] border-b border-[#3a3a3a] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-1">
                          {profile.name || "Anonymous User"}
                        </h2>
                        <div className="font-mono text-sm text-gray-400 bg-[#3a3a3a] px-3 py-1 rounded-lg inline-block">
                          {address
                            ? `${address.slice(0, 6)}...${address.slice(-4)}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Content */}
                <div className="p-6">
                  {isProfileLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <User className="w-4 h-4" />
                          Full Name
                          {isEditing && <span className="text-red-400">*</span>}
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={tempProfile.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              placeholder="Enter your full name"
                              className={`w-full bg-[#3a3a3a] rounded-lg p-4 text-white border transition-colors placeholder-gray-500 ${
                                errors.name
                                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                  : "border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              }`}
                            />
                            {errors.name && (
                              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                {errors.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#3a3a3a] rounded-lg p-4 min-h-[56px] flex items-center">
                            {profile.name || (
                              <span className="text-gray-500 italic">
                                Add your name to personalize your profile
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contact Field */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <Mail className="w-4 h-4" />
                          Contact Information
                          {isEditing && <span className="text-red-400">*</span>}
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={tempProfile.contact}
                              onChange={(e) =>
                                handleInputChange("contact", e.target.value)
                              }
                              placeholder="Email, LinkedIn, or other contact info"
                              className={`w-full bg-[#3a3a3a] rounded-lg p-4 text-white border transition-colors placeholder-gray-500 ${
                                errors.contact
                                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                  : "border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              }`}
                            />
                            {errors.contact && (
                              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                {errors.contact}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#3a3a3a] rounded-lg p-4 min-h-[56px] flex items-center">
                            {profile.contact || (
                              <span className="text-gray-500 italic">
                                Share your email or social links
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bio Field */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                          <FileText className="w-4 h-4" />
                          Bio
                          {isEditing && <span className="text-red-400">*</span>}
                        </label>
                        {isEditing ? (
                          <div>
                            <textarea
                              value={tempProfile.bio}
                              onChange={(e) =>
                                handleInputChange("bio", e.target.value)
                              }
                              placeholder="Tell people about yourself, your profession, interests..."
                              rows={4}
                              className={`w-full bg-[#3a3a3a] rounded-lg p-4 text-white border transition-colors placeholder-gray-500 resize-none ${
                                errors.bio
                                  ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                  : "border-transparent focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              }`}
                            />
                            {errors.bio && (
                              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                {errors.bio}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#3a3a3a] rounded-lg p-4 min-h-[120px] flex items-start">
                            {profile.bio ? (
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {profile.bio}
                              </p>
                            ) : (
                              <span className="text-gray-500 italic">
                                Tell others about yourself, your work, and
                                interests
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isEditing && (
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3a3a3a]">
                          <button
                            onClick={handleCancel}
                            className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveProfile}
                            disabled={isSaving || !isFormValid()}
                            className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                              isSaving || !isFormValid()
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {isSaving ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {isSaving ? "Saving..." : "Save Profile"}
                          </button>
                        </div>
                      )}

                      {/* Validation Summary */}
                      {isEditing && !isFormValid() && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <div className="w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center">
                              <span className="text-xs">!</span>
                            </div>
                            <span className="font-medium">
                              Please complete all required fields before saving
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Tips */}
              <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-6 mt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Profile Tips
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      Your profile helps others understand who you are when
                      giving or receiving testimonials
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      Include professional contact information to increase
                      credibility
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      A good bio helps contextualize the testimonials you
                      receive
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Duplicate Testimonial Modal */}
        {showDuplicateModal && existingTestimonial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] max-w-md w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle size={20} className="text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Replace Existing Testimonial?
                  </h3>
                </div>
                <button
                  onClick={handleCancelReplace}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-300 mb-4">
                  You already have a testimonial from{" "}
                  <span className="font-semibold text-white">
                    {existingTestimonial.giverName || "this person"}
                  </span>
                  . Adding this new testimonial will replace the existing one.
                </p>

                {/* Existing Testimonial Preview */}
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">Current:</span>
                    <span className="text-sm font-medium text-white">
                      {existingTestimonial.giverName || "Anonymous"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    &ldquo;{existingTestimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>
                      {new Date(
                        existingTestimonial.timestamp * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                  This action cannot be undone. The blockchain will only store
                  the most recent testimonial from each person.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 p-6 border-t border-[#3a3a3a]">
                <button
                  onClick={handleCancelReplace}
                  className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplace}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Replace Testimonial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal />

      {/* Delete Testimonial Modal */}
      {deleteModal.isOpen && deleteModal.testimonial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Testimonial
                </h3>
              </div>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    testimonial: null,
                    isLoading: false,
                  })
                }
                className="text-gray-400 hover:text-white transition-colors"
                disabled={deleteModal.isLoading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this testimonial from{" "}
                <span className="font-semibold text-white">
                  {deleteModal.testimonial.giverName || "Anonymous"}
                </span>
                ?
              </p>

              {/* Testimonial Preview */}
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-white">
                    {deleteModal.testimonial.giverName || "Anonymous"}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-3">
                  &ldquo;{deleteModal.testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>
                    {new Date(
                      deleteModal.testimonial.timestamp * 1000
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium mb-1">
                      Permanent Deletion
                    </p>
                    <p className="text-red-200 text-xs">
                      This action cannot be undone. The testimonial will be
                      permanently removed from the blockchain and cannot be
                      recovered.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-[#3a3a3a]">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    testimonial: null,
                    isLoading: false,
                  })
                }
                disabled={deleteModal.isLoading}
                className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteModal.testimonial &&
                  handleDeleteTestimonial(deleteModal.testimonial)
                }
                disabled={deleteModal.isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteModal.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Action Modal - Only for Reject */}
      <TestimonialActionModal
        isOpen={actionModal.isOpen && actionModal.action === "reject"}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (!actionModal.testimonial) return;

          setActionModal((prev) => ({ ...prev, isLoading: true }));

          try {
            // Just remove from pending list (reject)
            removeTestimonial(actionModal.testimonial.id);
            showSuccess(
              "Testimonial rejected and permanently removed from Waku network"
            );

            // Close modal
            setActionModal({
              isOpen: false,
              action: "reject",
              testimonial: null,
              isLoading: false,
            });
          } catch (error) {
            console.error("Failed to reject testimonial:", error);
            showError("Failed to reject testimonial. Please try again.");
            setActionModal((prev) => ({ ...prev, isLoading: false }));
          }
        }}
        action={actionModal.action}
        giverName={actionModal.testimonial?.giverName || ""}
        isLoading={actionModal.isLoading}
      />
    </div>
  );
}
