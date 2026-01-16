"use client";

import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface CountUpProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
}

export function CountUp({
  value,
  className,
  duration = 2000,
  delay = 0,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timer = setTimeout(() => {
        setHasStarted(true);

        const startTime = Date.now();
        const endTime = startTime + duration;

        const updateCount = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);

          const currentCount = Math.floor(progress * value);
          setCount(currentCount);

          if (now < endTime) {
            requestAnimationFrame(updateCount);
          } else {
            setCount(value);
          }
        };

        updateCount();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInView, hasStarted, value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}
