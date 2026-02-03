const { nativeImage } = require('electron');
const path = require('path');

/**
 * 트레이 아이콘 로드
 *
 * Normal: 밝은 보라 VX
 * Muted: 같은 아이콘 (추후 별도 아이콘 추가 가능)
 */

function createTrayIcon(state = 'normal') {
  const iconPath = path.join(__dirname, '..', 'assets', 'volox-tray-icon.png');
  const img = nativeImage.createFromPath(iconPath);

  if (process.platform === 'darwin') {
    img.setTemplateImage(true);
  }

  return img;
}

module.exports = { createTrayIcon };
