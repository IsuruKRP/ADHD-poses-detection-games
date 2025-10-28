import { useCallback, useEffect, useRef, useState } from "react";

export default function useWebcamRecorder({
  width = 1280,
  height = 720,
  fps = 30,
} = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [permission, setPermission] = useState("idle"); // idle | granted | denied

  const setupStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: fps },
        },
      });
      streamRef.current = stream;
      // Mark permission granted as soon as we have a stream. Playing the
      // preview can fail due to autoplay policies, but that shouldn't be
      // interpreted as a camera permission denial.
      setPermission("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // play() may reject on browsers because of autoplay/user gesture
        // policies; swallow that error so we don't treat it as a permission
        // failure.
        videoRef.current.play().catch((err) => {
          // non-fatal preview play failure
          console.warn("video preview play prevented", err);
        });
      }
      return true;
    } catch (e) {
      console.error("Webcam permission error", e);
      setPermission("denied");
      return false;
    }
  }, [width, height, fps]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      const ok = await setupStream();
      if (!ok) return false;
    }

    chunksRef.current = [];
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    // Be defensive when checking isTypeSupported (some environments don't
    // expose MediaRecorder or its helpers).
    const supported =
      typeof MediaRecorder !== "undefined"
        ? candidates.find((m) =>
            typeof MediaRecorder.isTypeSupported === "function"
              ? MediaRecorder.isTypeSupported(m)
              : false
          )
        : null;
    const mimeType = supported || "video/webm";

    const mr = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 4_000_000,
    });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.start();
    setRecording(true);
    return true;
  }, [setupStream]);

  const stopRecording = useCallback(
    () =>
      new Promise((resolve) => {
        const mr = mediaRecorderRef.current;
        if (!mr) {
          // Also ensure tracks are stopped if recorder is missing
          try {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
            if (videoRef.current) videoRef.current.srcObject = null;
          } catch (err) {
            console.warn("error stopping stream without recorder", err);
          }
          return resolve(null);
        }

        const finalize = () => {
          // Stop all underlying media tracks (audio + video) so mic/cam turn off
          try {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
            if (videoRef.current) videoRef.current.srcObject = null;
          } catch (err) {
            console.warn("error stopping stream tracks after recording", err);
          }
          setRecording(false);
        };

        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mr.mimeType || "video/webm",
          });
          finalize();
          resolve(blob);
        };

        try {
          mr.stop();
        } catch (err) {
          // If stop() throws (already stopped), resolve with what we have
          console.warn("MediaRecorder.stop() threw", err);
          const blob = new Blob(chunksRef.current, {
            type: mr.mimeType || "video/webm",
          });
          finalize();
          resolve(blob);
        }
      }),
    []
  );

  useEffect(() => {
    const vid = videoRef.current;
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.warn("error stopping media recorder during cleanup", err);
        }
      }

      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch (err) {
          console.warn("error stopping stream tracks during cleanup", err);
        }
      }

      if (vid) vid.srcObject = null;
    };
  }, []);

  return {
    videoRef,
    setupStream,
    startRecording,
    stopRecording,
    recording,
    permission,
  };
}
