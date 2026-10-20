import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}` : "";
  return {
    id: `${base}/`,
    name: "Finly — kalkulatory finansowe",
    short_name: "Finly",
    description: "Kalkulator wynagrodzeń i kredytu hipotecznego.",
    lang: "pl",
    start_url: `${base}/salary`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#f8f8fc",
    theme_color: "#6546d7",
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
