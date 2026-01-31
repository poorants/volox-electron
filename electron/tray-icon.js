const { nativeImage } = require('electron');

/**
 * 16x16 트레이 아이콘 — 검정 배경 + 보라색 형광 "V"
 *
 * Normal: 밝은 보라 V + 글로우
 * Muted:  어두운 회색 V, 글로우 없음
 */

const SIZE = 16;

function createTrayIcon(state = 'normal') {
  const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);
  const isActive = state === 'normal' || state === 'active';

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    const srcA = a / 255;
    const dstA = pixels[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0) return;
    pixels[i] = Math.round((r * srcA + pixels[i] * dstA * (1 - srcA)) / outA);
    pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
    pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
    pixels[i + 3] = Math.round(outA * 255);
  }

  // --- Background: dark rounded rect ---
  const bg = { r: 0x12, g: 0x12, b: 0x14 };
  const cornerR = 2.2;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = Math.max(0, x < cornerR ? cornerR - x : x > SIZE - 1 - cornerR ? x - (SIZE - 1 - cornerR) : 0);
      const dy = Math.max(0, y < cornerR ? cornerR - y : y > SIZE - 1 - cornerR ? y - (SIZE - 1 - cornerR) : 0);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= cornerR + 0.5) {
        const alpha = dist <= cornerR ? 1.0 : Math.max(0, 1 - (dist - cornerR) / 0.5);
        setPixel(x, y, bg.r, bg.g, bg.b, Math.round(alpha * 255));
      }
    }
  }

  // --- "V" shape: two lines meeting at bottom center ---
  // Left leg: (3, 3) → (7.5, 13)
  // Right leg: (12, 3) → (7.5, 13)
  const legs = [
    { x0: 3, y0: 3, x1: 7.5, y1: 13 },
    { x0: 12, y0: 3, x1: 7.5, y1: 13 },
  ];

  const vColor = isActive
    ? { r: 0xA7, g: 0x8B, b: 0xFA } // bright violet
    : { r: 0x52, g: 0x52, b: 0x5B }; // zinc-600

  // Glow pass (active only)
  if (isActive) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let minDist = 999;
        for (const leg of legs) {
          minDist = Math.min(minDist, distToSegment(x, y, leg.x0, leg.y0, leg.x1, leg.y1));
        }
        if (minDist < 4) {
          const ga = 0.35 * Math.pow(1 - minDist / 4, 2);
          setPixel(x, y, 0x8B, 0x5C, 0xF6, Math.round(ga * 255));
        }
      }
    }
  }

  // Stroke pass — thick anti-aliased V
  const thickness = 1.8;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let minDist = 999;
      for (const leg of legs) {
        minDist = Math.min(minDist, distToSegment(x, y, leg.x0, leg.y0, leg.x1, leg.y1));
      }
      if (minDist < thickness + 0.7) {
        const alpha = Math.min(1, Math.max(0, (thickness + 0.7 - minDist) / 0.7));
        setPixel(x, y, vColor.r, vColor.g, vColor.b, Math.round(alpha * 255));
      }
    }
  }

  const png = encodePNG(SIZE, SIZE, pixels);
  const img = nativeImage.createFromBuffer(png);
  if (process.platform === 'darwin') {
    img.setTemplateImage(true);
  }
  return img;
}

// Distance from point to line segment
function distToSegment(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x0) * dx + (py - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x0 + t * dx, cy = y0 + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

/**
 * Minimal uncompressed PNG encoder (no zlib dependency)
 * Creates valid PNG with uncompressed IDAT chunks
 */
function encodePNG(width, height, rgba) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data: filter byte (0) + RGBA for each row
  const rawRowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rawRowLen * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rawRowLen] = 0; // no filter
    rgba.copy(rawData, y * rawRowLen + 1, y * width * 4, (y + 1) * width * 4);
  }

  // Deflate with stored blocks (no compression)
  const deflated = deflateStored(rawData);

  // Build chunks
  const chunks = [
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = crc32(crcData);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function deflateStored(data) {
  // zlib header (CM=8, CINFO=7, no dict, FLEVEL=0)
  const header = Buffer.from([0x78, 0x01]);
  const blocks = [];
  const maxBlock = 65535;

  for (let offset = 0; offset < data.length; offset += maxBlock) {
    const remaining = data.length - offset;
    const blockLen = Math.min(remaining, maxBlock);
    const isLast = offset + blockLen >= data.length;

    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 0x01 : 0x00;
    blockHeader.writeUInt16LE(blockLen, 1);
    blockHeader.writeUInt16LE(blockLen ^ 0xFFFF, 3);

    blocks.push(blockHeader);
    blocks.push(data.subarray(offset, offset + blockLen));
  }

  // Adler32 checksum
  const adler = adler32(data);
  const adlerB = Buffer.alloc(4);
  adlerB.writeUInt32BE(adler, 0);

  return Buffer.concat([header, ...blocks, adlerB]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function adler32(buf) {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

module.exports = { createTrayIcon };
