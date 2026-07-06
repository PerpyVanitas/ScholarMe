import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScholarMe",
    short_name: "ScholarMe",
    description: "Honor Society Management Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8f680f",
    icons: [
      {
        src: "/icon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
