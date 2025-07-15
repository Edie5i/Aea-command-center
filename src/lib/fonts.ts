import { Lexend, Noto_Sans } from "next/font/google";

export const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
  weight: ["400", "500", "700", "900"],
});

export const noto_sans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["400", "500", "700", "900"],
});
