import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

const customPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#FAF8F4", // blanco hueso
      100: "#F5F1EB",
      200: "#E8DFD5",
      300: "#C9A882",
      400: "#A0826D",
      500: "#8B7355", // earthPrimary
      600: "#6B5B47", // earthDark
      700: "#5A4A3A", // earthDarker
      800: "#2C2C2C", // blackMedium
      900: "#1A1A1A", // blackSoft
      950: "#000000",
    },
  },
});

export default customPreset;
