import React from "react";
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer id="footer" className="bg-black text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="text-center sm:text-left">
            <h2 className="text-white text-lg font-semibold mb-4">About Us</h2>
            <p className="mb-4">
              VouchMe was developed by The Stable Order within the Stability
              Nexus.
            </p>
          </div>

          <div className="text-center sm:text-right">
            <h2 className="text-white text-lg font-semibold mb-4">Follow Us</h2>
            <div className="flex justify-center sm:justify-end gap-6">
              {/* Github */}
              <a
                href="https://github.com/StabilityNexus"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300"
              >
                <Github size={24} />
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/StabilityNexus"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4L20 20M4 20L20 4" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/z65e898Kpe"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02z" />
                </svg>
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/StabilityNexus"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701l-.332 4.865c.487 0 .703-.22.975-.48l2.34-2.355l4.964 3.557c.917.508 1.575.247 1.804-.85l3.274-15.424c.338-1.297-.5-1.884-1.418-1.482z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs pt-8 border-t border-gray-800 mt-8">
          © 2025 THE STABLE ORDER. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
