"use client"

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

export function AnimatedLogo() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-36 w-36">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="hsl(var(--card))"
        stroke="hsl(var(--destructive))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 h-full w-full text-primary transition-all duration-1000"
        style={{
          transform: isAnimated ? "scale(1)" : "scale(0.8)",
          opacity: isAnimated ? 1 : 0,
        }}
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <text
          x="7"
          y="15"
          textAnchor="middle"
          fontSize="2.5"
          fontWeight="normal"
          fontFamily="Times New Roman, serif"
          fill="hsl(var(--destructive))"
        >
          I ❤️
        </text>
        <text
          x="17"
          y="15"
          textAnchor="middle"
          fontSize="2.5"
          fontWeight="normal"
          fontFamily="Times New Roman, serif"
          fill="hsl(var(--destructive))"
        >
          Books
        </text>
      </svg>
      <Flame
        className="absolute top-[-20px] left-1/2 -translate-x-1/2 h-16 w-16 text-accent transition-all duration-500 delay-500"
        strokeWidth={1.5}
        style={{
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated
            ? "translateY(0) translateX(-50%)"
            : "translateY(10px) translateX(-50%)",
          animation: isAnimated ? 'candle-flame 3s ease-in-out infinite' : 'none'
        }}
      />
    </div>
  );
}
