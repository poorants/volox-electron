const loudness = require('loudness');

async function getCurrentVolume() {
  try {
    return await loudness.getVolume();
  } catch {
    return 50;
  }
}

async function adjustVolume(direction, step = 2) {
  const current = await getCurrentVolume();
  const change = Math.max(1, Math.round(step));
  const newLevel = direction === 'up'
    ? Math.min(100, current + change)
    : Math.max(0, current - change);
  try {
    await loudness.setVolume(newLevel);
    return { volume: newLevel, muted: false };
  } catch {
    return { volume: current, muted: false };
  }
}

async function toggleMute() {
  try {
    const muted = await loudness.getMuted();
    await loudness.setMuted(!muted);
    const volume = await loudness.getVolume();
    return { volume, muted: !muted };
  } catch {
    return { volume: 50, muted: false };
  }
}

module.exports = { adjustVolume, getCurrentVolume, toggleMute };
