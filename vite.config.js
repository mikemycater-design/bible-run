import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: nya versioner tas i bruk automatiskt vid nästa sidladdning,
      // ingen "uppdatering tillgänglig"-dialog och ingen risk att en öppen
      // flik fastnar på en gammal bygd version.
      registerType: "autoUpdate",
      // Vi registrerar service workern själva i main.jsx (via virtual:pwa-register)
      // istället för att låta pluginet injicera sin egen registrerings-tagg, så vi
      // kan schemalägga återkommande uppdateringskontroller (se main.jsx). Utan det
      // upptäcker webbläsaren en ny deploy bara vid nästa navigering/omladdning -
      // en flik som legat öppen länge (exakt scenariot som orsakade språkbuggen
      // tidigare) skulle annars aldrig märka att en ny version finns.
      injectRegister: null,
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Bible Run",
        short_name: "Bible Run",
        description: "Bible Run - ett bibelkunskaps-quiz mot klockan",
        lang: "sv",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#020617",
        theme_color: "#020617",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Rensa gamla precache-poster vid varje ny deploy - service workern
        // ska aldrig kunna servera en föråldrad bygd version av appen.
        cleanupOutdatedCaches: true,
        // Ingen runtimeCaching-regel för Supabase läggs till här, så alla
        // API-anrop (frågor, inloggning, resultat) går alltid direkt mot
        // nätverket precis som idag - service workern cachar bara den
        // statiska app-skalskoden (HTML/JS/CSS/ikoner), aldrig speldata.
      },
    }),
  ],
});
