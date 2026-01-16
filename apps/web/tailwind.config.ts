import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        aurora: "#38bdf8",
        cloud: "#f8fafc"
      }
    }
  },
  plugins: []
};

export default config;
