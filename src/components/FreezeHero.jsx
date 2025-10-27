import React, { useEffect, useState } from "react";
import useWebcamRecorder from "./hooks/useWebcamRecorder";
import HeaderBar from "./common/HeaderBar";
import SessionControls from "./common/SessionControls";
import DownloadPanel from "./common/DownloadPanel";

// 🎵 actions for the MOVE phase
const ACTIONS = [
  { text: "Raise your hands high 🙌" },
  { text: "Touch your shoulders 🤷‍♂️" },
  { text: "Spin your arms 🌀" },
  { text: "Stretch to the left ↩️" },
  { text: "Stretch to the right ↪️" },
  { text: "Jump lightly! 🕺" },
  { text: "Wave to the camera 👋" },
  { text: "Clap 3 times 👏👏👏" },
  { text: "Do a tiny dance 💃" },
];

// ⭐ simple confetti burst
function StarBurst({ trigger }) {
  const [bursts, setBursts] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const id = Math.random().toString(36).slice(2);
    const pieces = Array.from({ length: 15 }).map((_, i) => ({
      id: id + "-" + i,
      x: 50 + (Math.random() * 40 - 20),
      y: 50 + (Math.random() * 10 - 5),
      dx: Math.random() * 80 - 40,
      dy: -(Math.random() * 80 + 40),
      rot: Math.random() * 360,
      emoji: ["⭐", "✨", "💫", "🌟"][Math.floor(Math.random() * 4)],
    }));
    setBursts((b) => [...b, ...pieces]);
    const timeout = setTimeout(() => setBursts((b) => b.filter((p) => !p.id.startsWith(id))), 900);
    return () => clearTimeout(timeout);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bursts.map((p) => (
        <div
          key={p.id}
          className="absolute text-2xl"
          style={{
            left: `calc(${p.x}% + ${p.dx}px)`,
            top: `calc(${p.y}% + ${p.dy}px)`,
            transform: `rotate(${p.rot}deg)`,
            transition: "all 0.9s ease-out",
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

export default function FreezeHero({ onBack }) {
  const totalSec = 180; // 3 minutes
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("intro"); // intro | move | freeze | end
  const [childId, setChildId] = useState("");
  const [blob, setBlob] = useState(null);
  const [meta, setMeta] = useState(null);
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const [currentAction, setCurrentAction] = useState(null);
  const [burstKey, setBurstKey] = useState(0);

  const { videoRef, setupStream, startRecording, stopRecording } = useWebcamRecorder();

  // 🎵 background music (put your file in /public/audio/adhd.mp3)
  const moveAudio = new Audio("/audio/adhd.mp3");
  moveAudio.loop = true;

  useEffect(() => { setupStream(); }, []);

  // countdown timer
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endSession();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  // alternate MOVE / FREEZE every 5s
  useEffect(() => {
    if (!running) return;
    let current = "move";
    setPhase(current);
    setCurrentAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
    const id = setInterval(() => {
      current = current === "move" ? "freeze" : "move";
      setPhase(current);

      if (current === "move") {
        const next = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        setCurrentAction(next);
      } else {
        // trigger confetti each time FREEZE appears
        setBurstKey((k) => k + 1);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [running]);

  const startSession = async () => {
    setBlob(null); setMeta(null);
    const ok = await startRecording();
    if (!ok) return;
    setRunning(true);
    setPhase("move");
    setCurrentAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
    try {
      await moveAudio.play();
    } catch (err) {
      // ignore autoplay errors but log for debugging
      console.warn("moveAudio.play() failed:", err);
    }
  };

  const endSession = async () => {
    moveAudio.pause(); moveAudio.currentTime = 0;
    const b = await stopRecording();
    setBlob(b);
    setMeta({ game: "FreezeHero", childId, timestamp: Date.now(), durationSec: totalSec, note: "Alternating move/freeze with action prompts" });
    setRunning(false);
    setPhase("end");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1b4d] via-[#1b3a8f] to-[#274690] pb-10">
      <HeaderBar title="🦸 Freeze Hero Challenge" onBack={onBack} />
      {/* Hidden preview (not shown to child) */}
      <video ref={videoRef} className="hidden" playsInline muted />

      <SessionControls
        childId={childId}
        setChildId={setChildId}
        onStart={startSession}
        onStop={endSession}
        running={running}
        gameKey="FreezeHero"
        timeLeft={timeLeft}
        totalSec={totalSec}
      />

      <div className="mx-auto mt-6 w-full max-w-3xl p-6 rounded-3xl bg-white/10 text-center text-white relative overflow-hidden">
        {!running && phase === "intro" && (
          <>
            <h2 className="text-4xl font-extrabold">Be the Freeze Hero! ❄️</h2>
            <p className="mt-3 opacity-90">
              Move when it says <b>MOVE</b> 🕺 and stay SUPER still when it says <b>FREEZE</b> 🧊
            </p>
            <p className="mt-2 text-sm opacity-75">
              The camera records silently in the background. Your video preview is hidden.
            </p>
          </>
        )}

        {running && (
          <div className="mt-2">
            <h2 className="text-5xl font-black tracking-widest mt-2">
              {phase === "move" ? "MOVE! 💃" : "FREEZE! 🧊"}
            </h2>
            {phase === "move" && currentAction && (
              <p className="mt-5 text-2xl font-semibold text-yellow-300 animate-bounce">
                {currentAction.text}
              </p>
            )}
          </div>
        )}

        {phase === "end" && (
          <>
            <h2 className="text-3xl md:text-4xl font-extrabold">Great job, Freeze Hero! 🏆</h2>
            <p className="mt-2 opacity-90">Download your recorded session below.</p>
          </>
        )}
        <StarBurst trigger={burstKey} />
      </div>

      <DownloadPanel blob={blob} meta={meta} />
    </div>
  );
}
