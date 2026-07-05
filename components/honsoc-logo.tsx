import React from "react";

type LogoVariant = "white" | "black" | "gold" | "auto";

interface HonorSocietyLogoProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  size?: number;
  /**
   * 'white' = white logo (for dark backgrounds) — uses invert + screen blend
   * 'black' = black logo (for light backgrounds) — uses multiply blend
   * 'gold'  = gold logo — uses invert + sepia/hue-rotate + screen blend
   * 'auto'  = black in light mode, white in dark mode
   */
  variant?: LogoVariant;
}

// CSS filter + blend-mode combos for each variant.
// Source image is black artwork on white background.
const VARIANT_STYLES: Record<
  Exclude<LogoVariant, "auto">,
  React.CSSProperties
> = {
  white: {
    filter: "invert(1)",
    mixBlendMode: "screen",
  },
  black: {
    mixBlendMode: "multiply",
  },
  gold: {
    filter: "invert(1) sepia(1) saturate(8) hue-rotate(15deg) brightness(1.05)",
    mixBlendMode: "screen",
  },
};

const LOGO_SRC = "/honsoc-logo.png";

export function HonorSocietyLogo({
  size,
  variant = "white",
  className = "",
  style,
  ...props
}: HonorSocietyLogoProps) {
  if (variant === "auto") {
    return (
      <>
        {/* Black logo in light mode (multiply blend removes white bg) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="CIT-U Honor Society Logo"
          width={size}
          height={size}
          className={`${className} block dark:hidden`}
          style={{ ...style, mixBlendMode: "multiply" }}
          draggable={false}
          {...props}
        />
        {/* White logo in dark mode (invert + screen blend removes black bg) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="CIT-U Honor Society Logo"
          width={size}
          height={size}
          className={`${className} hidden dark:block`}
          style={{ ...style, filter: "invert(1)", mixBlendMode: "screen" }}
          draggable={false}
          {...props}
        />
      </>
    );
  }

  const variantStyle = VARIANT_STYLES[variant];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="CIT-U Honor Society Logo"
      width={size}
      height={size}
      className={className}
      style={{ ...style, ...variantStyle }}
      draggable={false}
      {...props}
    />
  );
}
