import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function IlbooksLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
       <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="hsl(var(--card))"
        stroke="hsl(var(--destructive))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
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
        className="absolute top-[-15%] h-[70%] w-[70%] text-accent"
        strokeWidth={1.5}
      />
    </div>
  );
}
