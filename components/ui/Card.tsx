import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
<div
  className={cn("bg-white rounded-kawaii shadow-kawaii p-6 transition-shadow hover:shadow-kawaii-lg", className)}
  {...props}
/>
  );
}