import {
  Baloo_2 as FontDisplay,
  Comic_Neue as FontBody,
  Fira_Code as FontMono,
} from "next/font/google";

export const fontDisplay = FontDisplay({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

export const fontSans = FontBody({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "700"],
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
