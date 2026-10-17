/**
 * A soft two-note chime made with the Web Audio API (no sound file). Browsers block
 * audio until the user has interacted with the page, so if playback isn't allowed yet
 * it waits for the next tap or click and plays once then.
 */
export function playChime() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const play = () => {
    const now = context.currentTime;
    [
      { frequency: 880, start: 0 },
      { frequency: 1174.66, start: 0.16 }
    ].forEach(({ frequency, start }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.07, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.45);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + 0.5);
    });
    window.setTimeout(() => void context.close(), 1200);
  };

  let played = false;
  const onGesture = () => {
    void context.resume().then(playOnce);
  };
  const stopWaiting = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
  function playOnce() {
    if (played || context.state !== "running") return;
    played = true;
    stopWaiting();
    play();
  }

  if (context.state === "running") {
    playOnce();
    return;
  }
  void context.resume().then(playOnce);
  window.addEventListener("pointerdown", onGesture, { once: true });
  window.addEventListener("keydown", onGesture, { once: true });
}
