import React, { useState } from "react";
import FreezeHero from "./components/FreezeHero";
import FocusDistract from "./components/FocusDistract";

export default function App() {
  const [route, setRoute] = useState("home"); // home | freeze | distract

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1b4d] via-[#1b3a8f] to-[#274690] text-white">
      {route === "home" && (
        <div className="min-h-screen flex flex-col">
          <div className="px-6 py-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-4xl font-black tracking-wide drop-shadow">
              🎮 Pose Games Lab
            </h1>
          </div>

          <main className="flex-1 flex items-center justify-center p-6">
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
              <div className="p-6 rounded-3xl bg-white/10">
                <h2 className="text-2xl font-extrabold">🦸 Freeze Hero</h2>
                <p className="mt-2 opacity-90">
                  Move when told, freeze when asked. Great for capturing fidgeting during stillness.
                </p>
                <button
                  className="px-5 py-3 rounded-2xl font-semibold shadow hover:shadow-lg active:scale-95 transition-all bg-[#ffd60a] text-black mt-4"
                  onClick={() => setRoute("freeze")}
                >
                  Play
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white/10">
                <h2 className="text-2xl font-extrabold">🎯 Focus & Distract</h2>
                <p className="mt-2 opacity-90">
                  Keep your eyes on the target while toys float around. Measures attention & posture stability.
                </p>
                <button
                  className="px-5 py-3 rounded-2xl font-semibold shadow hover:shadow-lg active:scale-95 transition-all bg-[#ffd60a] text-black mt-4"
                  onClick={() => setRoute("distract")}
                >
                  Play
                </button>
              </div>
            </div>
          </main>

          <footer className="px-6 py-6 text-center text-white/70 text-sm">
            Built for data collection • Webcam preview hidden • Download WebM + JSON
          </footer>
        </div>
      )}

      {route === "freeze" && <FreezeHero onBack={() => setRoute("home")} />}
      {route === "distract" && <FocusDistract onBack={() => setRoute("home")} />}
    </div>
  );
}
