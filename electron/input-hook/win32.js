const koffi = require('koffi');

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const WH_MOUSE_LL = 14;
const WH_KEYBOARD_LL = 13;
const WM_MOUSEWHEEL = 0x020A;
const WM_MBUTTONDOWN = 0x0207;
const WM_KEYDOWN = 0x0100;
const WM_SYSKEYDOWN = 0x0104;
const VK_MENU = 0x12;
const VK_CONTROL = 0x11;
const VK_SHIFT = 0x10;
const VK_LWIN = 0x5B;

// Trigger name → VK code mapping
const TRIGGER_VK_MAP = {
  arrowUp: 0x26,
  arrowDown: 0x28,
  keyM: 0x4D,
};

const MSLLHOOKSTRUCT = koffi.struct('MSLLHOOKSTRUCT', {
  x: 'int32',
  y: 'int32',
  mouseData: 'uint32',
  flags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr',
});
const pMSLLHOOKSTRUCT = koffi.pointer(MSLLHOOKSTRUCT);

const KBDLLHOOKSTRUCT = koffi.struct('KBDLLHOOKSTRUCT', {
  vkCode: 'uint32',
  scanCode: 'uint32',
  flags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr',
});
const pKBDLLHOOKSTRUCT = koffi.pointer(KBDLLHOOKSTRUCT);

const LowLevelMouseProc = koffi.proto('LowLevelMouseProc', 'intptr', ['int', 'uintptr', pMSLLHOOKSTRUCT]);
const LowLevelKeyboardProc = koffi.proto('LowLevelKeyboardProc', 'intptr', ['int', 'uintptr', pKBDLLHOOKSTRUCT]);

const SetWindowsHookExW_Mouse = user32.func('SetWindowsHookExW', 'intptr', ['int', koffi.pointer(LowLevelMouseProc), 'intptr', 'uint32']);
const SetWindowsHookExW_KB = user32.func('SetWindowsHookExW', 'intptr', ['int', koffi.pointer(LowLevelKeyboardProc), 'intptr', 'uint32']);
const CallNextHookEx_Mouse = user32.func('CallNextHookEx', 'intptr', ['intptr', 'int', 'uintptr', pMSLLHOOKSTRUCT]);
const CallNextHookEx_KB = user32.func('CallNextHookEx', 'intptr', ['intptr', 'int', 'uintptr', pKBDLLHOOKSTRUCT]);
const UnhookWindowsHookEx = user32.func('UnhookWindowsHookEx', 'int', ['intptr']);
const GetAsyncKeyState = user32.func('GetAsyncKeyState', 'short', ['int']);
const GetModuleHandleW = kernel32.func('GetModuleHandleW', 'intptr', ['str16']);

let mouseHookHandle = null;
let kbHookHandle = null;
let mouseCallbackRef = null;
let kbCallbackRef = null;
let eventHandler = null;

// Capture mode
let captureMode = false;
let captureCallback = null;

// Current shortcuts config for matching inside hooks
let currentShortcuts = null;
// Prebuilt: VK code → { action, direction } for keyboard triggers
let kbTriggerMap = {};

const MODIFIER_VK = {
  alt: VK_MENU,
  ctrl: VK_CONTROL,
  shift: VK_SHIFT,
  meta: VK_LWIN,
};

function isKeyDown(vk) {
  return (GetAsyncKeyState(vk) & 0x8000) !== 0;
}

function getModifiers() {
  return {
    alt: isKeyDown(VK_MENU),
    ctrl: isKeyDown(VK_CONTROL),
    shift: isKeyDown(VK_SHIFT),
    meta: isKeyDown(VK_LWIN),
  };
}

function getActiveModifier(mods) {
  if (mods.alt) return 'alt';
  if (mods.ctrl) return 'ctrl';
  if (mods.shift) return 'shift';
  if (mods.meta) return 'meta';
  return null;
}

/**
 * Check if a mouse event matches any configured shortcut.
 * Returns the matched action name or null.
 */
function matchMouseEvent(wParam, mouseData) {
  if (!currentShortcuts) return null;

  const actions = ['volumeUp', 'volumeDown', 'mute'];
  for (const action of actions) {
    const sc = currentShortcuts[action];
    if (!sc) continue;

    // Check modifier
    if (!isKeyDown(MODIFIER_VK[sc.modifier])) continue;

    if (wParam === WM_MOUSEWHEEL) {
      const hiWord = (mouseData >>> 16) & 0xFFFF;
      const delta = hiWord > 32767 ? hiWord - 65536 : hiWord;
      if (sc.trigger === 'wheelUp' && delta > 0) return action;
      if (sc.trigger === 'wheelDown' && delta < 0) return action;
    } else if (wParam === WM_MBUTTONDOWN) {
      if (sc.trigger === 'middleClick') return action;
    }
  }
  return null;
}

/**
 * Build kbTriggerMap from shortcuts config.
 * Maps VK codes to { modifier, action } for keyboard triggers.
 */
function buildKbTriggerMap() {
  kbTriggerMap = {};
  if (!currentShortcuts) return;

  const actions = ['volumeUp', 'volumeDown', 'mute'];
  for (const action of actions) {
    const sc = currentShortcuts[action];
    if (!sc) continue;
    const vk = TRIGGER_VK_MAP[sc.trigger];
    if (vk === undefined) continue; // mouse trigger, not keyboard
    // Store: vk → list of {modifier, action}
    if (!kbTriggerMap[vk]) kbTriggerMap[vk] = [];
    kbTriggerMap[vk].push({ modifier: sc.modifier, action });
  }
}

function setShortcuts(shortcuts) {
  currentShortcuts = shortcuts;
  buildKbTriggerMap();
}

function startHook(onEvent) {
  eventHandler = onEvent;
  const hModule = GetModuleHandleW(null);

  // --- Mouse hook ---
  mouseCallbackRef = koffi.register((nCode, wParam, lParam) => {
    try {
      if (nCode >= 0) {
        const mods = getModifiers();
        const anyModifier = mods.alt || mods.ctrl || mods.shift || mods.meta;

        // Capture mode: intercept next modifier + trigger
        if (captureMode && anyModifier) {
          const modifier = getActiveModifier(mods);

          if (wParam === WM_MOUSEWHEEL) {
            const data = koffi.decode(lParam, MSLLHOOKSTRUCT);
            const hiWord = (data.mouseData >>> 16) & 0xFFFF;
            const delta = hiWord > 32767 ? hiWord - 65536 : hiWord;
            const trigger = delta > 0 ? 'wheelUp' : 'wheelDown';

            if (captureCallback) {
              captureCallback({ modifier, trigger });
            }
            captureMode = false;
            captureCallback = null;
            return 1; // block during capture
          } else if (wParam === WM_MBUTTONDOWN) {
            if (captureCallback) {
              captureCallback({ modifier, trigger: 'middleClick' });
            }
            captureMode = false;
            captureCallback = null;
            return 1; // block during capture
          }
        }
        // Normal mode: check if event matches a shortcut
        else if (anyModifier && eventHandler) {
          const data = (wParam === WM_MOUSEWHEEL) ? koffi.decode(lParam, MSLLHOOKSTRUCT) : null;
          const matched = matchMouseEvent(wParam, data ? data.mouseData : 0);

          if (matched) {
            // Fire event handler
            if (wParam === WM_MOUSEWHEEL) {
              const hiWord = (data.mouseData >>> 16) & 0xFFFF;
              const delta = hiWord > 32767 ? hiWord - 65536 : hiWord;
              eventHandler({
                type: 'wheel',
                modifiers: mods,
                direction: delta > 0 ? 'up' : 'down',
              });
            } else if (wParam === WM_MBUTTONDOWN) {
              eventHandler({
                type: 'middleClick',
                modifiers: mods,
              });
            }
            return 1; // block the event
          }
        }
      }
    } catch (e) {
      console.error('Mouse hook error:', e);
    }

    return CallNextHookEx_Mouse(mouseHookHandle, nCode, wParam, lParam);
  }, koffi.pointer(LowLevelMouseProc));

  mouseHookHandle = SetWindowsHookExW_Mouse(WH_MOUSE_LL, mouseCallbackRef, hModule, 0);
  console.log('Mouse hook installed:', !!mouseHookHandle);

  // --- Keyboard hook ---
  kbCallbackRef = koffi.register((nCode, wParam, lParam) => {
    try {
      if (nCode >= 0 && (wParam === WM_KEYDOWN || wParam === WM_SYSKEYDOWN)) {
        const data = koffi.decode(lParam, KBDLLHOOKSTRUCT);
        const vk = data.vkCode;
        const mods = getModifiers();
        const anyModifier = mods.alt || mods.ctrl || mods.shift || mods.meta;

        // Capture mode
        if (captureMode && anyModifier) {
          const modifier = getActiveModifier(mods);
          // Find trigger name for this VK
          let trigger = null;
          for (const [name, code] of Object.entries(TRIGGER_VK_MAP)) {
            if (code === vk) { trigger = name; break; }
          }
          if (trigger && captureCallback) {
            captureCallback({ modifier, trigger });
            captureMode = false;
            captureCallback = null;
            return 1;
          }
        }

        // Normal mode: check kbTriggerMap
        const entries = kbTriggerMap[vk];
        if (entries && eventHandler) {
          for (const entry of entries) {
            if (isKeyDown(MODIFIER_VK[entry.modifier])) {
              eventHandler({
                type: 'keyboard',
                action: entry.action,
                modifiers: mods,
              });
              return 1; // block
            }
          }
        }
      }
    } catch (e) {
      console.error('Keyboard hook error:', e);
    }

    return CallNextHookEx_KB(kbHookHandle, nCode, wParam, lParam);
  }, koffi.pointer(LowLevelKeyboardProc));

  kbHookHandle = SetWindowsHookExW_KB(WH_KEYBOARD_LL, kbCallbackRef, hModule, 0);
  console.log('Keyboard hook installed:', !!kbHookHandle);
}

function stopHook() {
  if (mouseHookHandle) {
    UnhookWindowsHookEx(mouseHookHandle);
    mouseHookHandle = null;
  }
  if (kbHookHandle) {
    UnhookWindowsHookEx(kbHookHandle);
    kbHookHandle = null;
  }
  if (mouseCallbackRef) {
    koffi.unregister(mouseCallbackRef);
    mouseCallbackRef = null;
  }
  if (kbCallbackRef) {
    koffi.unregister(kbCallbackRef);
    kbCallbackRef = null;
  }
  eventHandler = null;
}

function startCapture(callback) {
  captureMode = true;
  captureCallback = callback;
}

function cancelCapture() {
  captureMode = false;
  captureCallback = null;
}

module.exports = { startHook, stopHook, startCapture, cancelCapture, setShortcuts };
