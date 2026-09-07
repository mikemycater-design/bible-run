import React from "react";
import ReactDOM from "react-dom/client";
import BibleRun from "./BibleRun.jsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// registerType "autoUpdate" gör att en ny service worker tar över direkt (utan
// att fråga användaren) så fort webbläsaren upptäcker den. Men webbläsaren
// letar bara efter en ny version vid navigering/omladdning - en flik som legat
// öppen länge (t.ex. i bakgrunden på mobilen) skulle annars aldrig få reda på
// att en ny deploy finns. Vi tvingar därför fram en kontroll varje timme och
// varje gång fliken blir synlig igen, så appen aldrig kan fastna på gammal kod.
if ("serviceWorker" in navigator) {
  // Laddar om sidan så fort en ny service worker tar över kontrollen - det är
  // den händelse webbläsaren garanterat skickar (verifierat manuellt) när
  // skipWaiting/clientsClaim aktiverat en ny version, oavsett vad som
  // triggade uppdateringskontrollen. clientsClaim gör dock att samma händelse
  // FÖRSTA gången någonsin också fyras av (sidan går från "ostyrd" till
  // "styrd" av sin egen första service worker) - det är inte en uppdatering
  // och ska inte trigga en omladdning, annars laddas varje förstabesök om en
  // extra gång i onödan (verifierat: utan den här spärren hände det).
  let hasController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hasController) {
      hasController = true;
      return;
    }
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update();
      });
    },
  });
  void updateSW;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BibleRun />
  </React.StrictMode>
);
