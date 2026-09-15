/**
 * UPI Soundbox & Payment Success Chime
 * Synthesizes an authentic ascending melodic confirmation tone
 * similar to Paytm / PhonePe Soundboxes used at Indian merchant checkouts.
 */
export const playUpiPaymentChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // Melodic ascending sequence: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz) -> E6 (1318.51Hz)
    const tones = [
      { freq: 659.25, start: 0, dur: 0.11 },
      { freq: 830.61, start: 0.11, dur: 0.11 },
      { freq: 987.77, start: 0.22, dur: 0.14 },
      { freq: 1318.51, start: 0.36, dur: 0.38 },
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(t.freq, now + t.start);
      
      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0.0001, now + t.start);
      gain.gain.exponentialRampToValueAtTime(0.28, now + t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur + 0.05);
    });
  } catch (err) {
    // Gracefully handle browser autoplay policies
    console.warn('UPI sound chime could not be synthesized:', err);
  }
};
