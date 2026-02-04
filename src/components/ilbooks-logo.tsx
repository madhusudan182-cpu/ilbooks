import { BookOpen, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function IlbooksLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <BookOpen
        className="h-full w-full text-primary"
        strokeWidth={1.5}
      />
      <Flame
        className="absolute top-[-15%] h-[70%] w-[70%] text-accent"
        strokeWidth={1.5}
      />
    </div>
  );
}
