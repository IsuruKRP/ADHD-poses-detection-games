import React, { useEffect, useState } from "react";
import useWebcamRecorder from "./hooks/useWebcamRecorder";
import HeaderBar from "./common/HeaderBar";
import SessionControls from "./common/SessionControls";
import DownloadPanel from "./common/DownloadPanel";
import AlienGame from "./AlienGame";

export default function FocusDistract({ onBack }) {
  const totalSec = 180;

  const [running, setRunning] = useState(false);
  const [childId, setChildId] = useState("");
  const [age, setAge] = useState("");
  const [group, setGroup] = useState("");
  const [blob, setBlob] = useState(null);
  const [meta, setMeta] = useState(null);
  const [timeLeft, setTimeLeft] = useState(totalSec);

  const { videoRef, setupStream, startRecording, stopRecording } = useWebcamRecorder();

  // 📷 Setup webcam
  useEffect(() => {
    setupStream();
  }, [setupStream]);

  // ⏱ Countdown timer
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endSession(); // auto end if timer runs out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  // ▶ Start session
  const startSession = async () => {
    const ok = await startRecording();
    if (!ok) return;
    setBlob(null);
    setMeta(null);
    setTimeLeft(totalSec);
    setRunning(true);
  };

  // ⏹ End session
  const endSession = async (score = 0) => {
    const b = await stopRecording();
    setBlob(b);
    setMeta({
      game: "AlienFocus",
      childId,
      age,
      group,
      score,
      timestamp: Date.now(),
      durationSec: totalSec - timeLeft,
    });
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1b4d] via-[#1b3a8f] to-[#274690] pb-10">
      <HeaderBar title="👽 Alien Focus Game" onBack={onBack} />
      <video ref={videoRef} className="hidden" playsInline muted />

      <SessionControls
        childId={childId}
        setChildId={setChildId}
        age={age}
        setAge={setAge}
        group={group}
        setGroup={setGroup}
        onStart={startSession}
        onStop={() => endSession(0)}
        running={running}
        gameKey="AlienFocus"
        timeLeft={timeLeft}
        totalSec={totalSec}
      />

      {running ? (
        <AlienGame endGame={(score) => endSession(score)} />
      ) : (
        <div className="mx-auto mt-6 w-full max-w-2xl p-6 rounded-3xl bg-white/10 text-white text-center">
          <h2 className="text-3xl font-extrabold">Alien Focus Game 👾</h2>
          <p className="mt-2 opacity-80">
            Press <b>Space</b> to keep the alien flying. Avoid barriers and stay in the air to earn points!
          </p>
        </div>
      )}

      <DownloadPanel blob={blob} meta={meta} />
    </div>
  );
}
