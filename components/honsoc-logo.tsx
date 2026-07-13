import React from "react";
import { useTheme } from "next-themes";

interface HonorSocietyLogoProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  size?: number;
}

export function HonorSocietyLogo({
  size,
  className = "",
  style,
  ...props
}: HonorSocietyLogoProps) {
  return (
    <>
      {/* Light Mode Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt="CIT-U Honor Society Logo"
        width={size}
        height={size}
        className={`${className} block dark:hidden`}
        style={style}
        draggable={false}
        {...props}
      />
      {/* Dark Mode Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt="CIT-U Honor Society Logo"
        width={size}
        height={size}
        className={`${className} hidden dark:block`}
        style={style}
        draggable={false}
        {...props}
      />
    </>
  );
}
