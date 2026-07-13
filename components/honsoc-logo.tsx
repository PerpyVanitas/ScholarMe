import React from "react";
import Image from "next/image";

interface HonorSocietyLogoProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height"
> {
  size?: number;
  variant?: "auto" | "white" | "black" | "gold"; // kept for backwards compatibility but we will just use black or the specific variants if they exist
}

export function HonorSocietyLogo({
  size = 40,
  variant = "auto",
  className = "",
  style,
  ...props
}: HonorSocietyLogoProps) {
  // The user explicitly requested to just use the black logo version so it is more visible
  const src =
    variant === "white"
      ? "/honsoc-logo-white.png"
      : variant === "gold"
        ? "/honsoc-logo-gold.png"
        : "/honsoc-logo-black.png";

  return (
    <Image
      src={src}
      alt="CIT-U Honor Society Logo"
      width={size}
      height={size}
      className={className}
      style={style}
      draggable={false}
      {...props}
    />
  );
}
