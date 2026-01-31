const loudness = require('loudness');

// In-memory volume cache to avoid async getVolume() on every repeat tick
let cachedVolume = null;

async function getCurrentVolume() {
  try {
    cachedVolume = await loudness.getVolume();
    return cachedVolume;
  } catch {
    return cachedVolume ?? 50;
  }
}

// Sync volume calculation + fire-and-forget setVolume
function adjustVolumeSync(direction, step = 2) {
  if (cachedVolume === null) return null; // not initialized yet
  const change = Math.max(1, Math.round(step));
  const newLevel = direction === 'up'
    ? Math.min(100, cachedVolume + change)
    : Math.max(0, cachedVolume - change);
  cachedVolume = newLevel;
  loudness.setVolume(newLevel).catch(() => {});
  return { volume: newLevel, muted: false };
}

async function adjustVolume(direction, step = 2) {
  if (cachedVolume === null) await getCurrentVolume();
  return adjustVolumeSync(direction, step);
}

async function toggleMute() {
  try {
    const muted = await loudness.getMuted();
    await loudness.setMuted(!muted);
    cachedVolume = await loudness.getVolume();
    return { volume: cachedVolume, muted: !muted };
  } catch {
    return { volume: cachedVolume ?? 50, muted: false };
  }
}

module.exports = { adjustVolume, adjustVolumeSync, getCurrentVolume, toggleMute };
