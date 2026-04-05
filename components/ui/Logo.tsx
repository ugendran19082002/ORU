import React from "react";
import { Image, ImageStyle } from "react-native";

// Asset: assets/images/splash-icon.png (water-drop ThanniGo logo)
const LOGO_SOURCE = require("../../assets/images/splash-icon.png");

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  style?: ImageStyle;
}

const SIZES = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 64,
};

/**
 * ThanniGo logo — the water-drop icon from assets/images/splash-icon.png.
 * Transparent PNG; no border radius applied so the drop shape is preserved.
 * Use alongside a <Text>ThanniGo</Text> sibling for full branding.
 */
export function Logo({ size = "md", style }: LogoProps) {
  const dim = SIZES[size];
  return (
    <Image
      source={LOGO_SOURCE}
      style={[
        {
          width: dim,
          height: dim,
          backgroundColor: "white",
          borderRadius: Math.round(dim * 0.2),
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}
