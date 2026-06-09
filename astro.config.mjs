import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mcp from "astro-mcp";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react(), mcp()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["react-router-dom", "react-router"],
    },
  },
});
