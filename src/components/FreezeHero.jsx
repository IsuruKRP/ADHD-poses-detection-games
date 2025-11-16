import React, { useCallback, useEffect, useRef, useState } from "react";
import useWebcamRecorder from "./hooks/useWebcamRecorder";
import HeaderBar from "./common/HeaderBar";
import SessionControls from "./common/SessionControls";
import DownloadPanel from "./common/DownloadPanel";

// 🎵 actions for the MOVE phase
const ACTIONS = [
  { text: "Raise your hands high 🙌" },
  { text: "Touch your shoulders 🤷‍♂️" },
  { text: "Wave to the camera 👋" },
  { text: "Clap  times 👏👏👏" },
];
const ACTION_VIDEOS = {
  "Raise your hands high 🙌": "/video/raise_hands.mp4",
  "Touch your shoulders 🤷‍♂️": "/video/touch_shoulders.mp4",
  "Wave to the camera 👋": "/video/waves.mp4",
  "Clap  times 👏👏👏": "/video/clap.mp4",
};


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
const [group, setGroup] = useState("");
const [age, setAge] = useState("");

  const [blob, setBlob] = useState(null);
  const [meta, setMeta] = useState(null);
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const [currentAction, setCurrentAction] = useState(null);
  const [burstKey, setBurstKey] = useState(0);
  const { videoRef, setupStream, startRecording, stopRecording } = useWebcamRecorder();

  // 🎵 background music persisted across renders
  const moveAudioRef = useRef(null);
  const sessionStartRef = useRef(null);
  useEffect(() => {
  const audio = new Audio("/audio/adhd.mp3");
  audio.loop = true;
  audio.volume = 0.5; // 🔉 adjust volume (0.0 to 1.0)
  audio.preload = "auto"; // ensure browser loads it ahead
  moveAudioRef.current = audio;

  return () => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  };
}, []);

  useEffect(() => { setupStream(); }, [setupStream]);

  // stable Stop handler, defined before hooks that reference it
  const endSession = useCallback(async () => {
    // Stop the background music safely
    if (moveAudioRef.current) {
      moveAudioRef.current.pause();
      moveAudioRef.current.currentTime = 0; // reset to start
    }

    // Stop the webcam recording
    const b = await stopRecording();
    if (b) setBlob(b);

    // Save session metadata
    setMeta({
  game: "FreezeHero",
  childId,
  group,
  age,
  timestamp: Date.now(),
  durationSec: sessionStartRef.current
    ? Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000))
    : undefined,
  note: "Alternating move/freeze with action prompts",
});


    // Reset states
    setRunning(false);
    setPhase("end");
    setTimeLeft(totalSec); // optional: reset timer for next session
  }, [childId, group, age, stopRecording, totalSec]);

  // countdown timer
  // Keep latest endSession in a ref to avoid effect deps churn
  const endSessionRef = useRef(() => {});
  const MOVE_DURATION = 10;
  const FREEZE_DURATION = 5;
  const phaseTimeoutRef = useRef(null);
  const currentPhaseRef = useRef("move");
  useEffect(() => { endSessionRef.current = endSession; }, [endSession]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endSessionRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  // alternate MOVE / FREEZE with different durations
  useEffect(() => {
    if (!running) {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      return;
    }

    const switchPhase = () => {
      if (currentPhaseRef.current === "move") {
        currentPhaseRef.current = "freeze";
        setPhase("freeze");
        setBurstKey((k) => k + 1); // trigger confetti
        phaseTimeoutRef.current = setTimeout(switchPhase, FREEZE_DURATION * 1000);
      } else {
        currentPhaseRef.current = "move";
        setPhase("move");
        const next = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        setCurrentAction(next);
        phaseTimeoutRef.current = setTimeout(switchPhase, MOVE_DURATION * 1000);
      }
    };

    // Start with move
    currentPhaseRef.current = "move";
    setPhase("move");
    setCurrentAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
    phaseTimeoutRef.current = setTimeout(switchPhase, MOVE_DURATION * 1000);

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [running]);

  const startSession = async () => {
    setBlob(null); setMeta(null);
    const ok = await startRecording();
    if (!ok) return;
    setRunning(true);
    setPhase("move");
    setCurrentAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
    sessionStartRef.current = Date.now();
    try {
      await moveAudioRef.current?.play();
    } catch (err) {
      // ignore autoplay errors but log for debugging
      console.warn("moveAudio.play() failed:", err);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1b4d] via-[#1b3a8f] to-[#274690] pb-10">
      <HeaderBar title="🦸 Freeze Hero Challenge" onBack={onBack} />
      {/* Hidden preview (not shown to child) */}
      <video ref={videoRef} className="hidden" playsInline muted />

      <SessionControls
         childId={childId}
  setChildId={setChildId}
  group={group}
  setGroup={setGroup}
  age={age}
  setAge={setAge}
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
              The camera records silently in the background. 
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
        {phase === "move" && currentAction && (
  <div className="mt-4 flex justify-center">
    <video
      key={currentAction.text} // force reload when action changes
      src={ACTION_VIDEOS[currentAction.text]}
      width={360}
      autoPlay
      muted
      loop
      playsInline
      className="rounded-xl border border-white/20 shadow-lg"
    />
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
