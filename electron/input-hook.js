const koffi = require('koffi');

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const WH_MOUSE_LL = 14;
const WM_MOUSEWHEEL = 0x020A;
const WM_MBUTTONDOWN = 0x0207;
const VK_MENU = 0x12;
const VK_CONTROL = 0x11;
const VK_SHIFT = 0x10;
const VK_LWIN = 0x5B;

const MSLLHOOKSTRUCT = koffi.struct('MSLLHOOKSTRUCT', {
  x: 'int32',
  y: 'int32',
  mouseData: 'uint32',
  flags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr',
});
const pMSLLHOOKSTRUCT = koffi.pointer(MSLLHOOKSTRUCT);

const LowLevelMouseProc = koffi.proto('LowLevelMouseProc', 'intptr', ['int', 'uintptr', pMSLLHOOKSTRUCT]);

const SetWindowsHookExW = user32.func('SetWindowsHookExW', 'intptr', ['int', koffi.pointer(LowLevelMouseProc), 'intptr', 'uint32']);
const CallNextHookEx = user32.func('CallNextHookEx', 'intptr', ['intptr', 'int', 'uintptr', pMSLLHOOKSTRUCT]);
const UnhookWindowsHookEx = user32.func('UnhookWindowsHookEx', 'int', ['intptr']);
const GetAsyncKeyState = user32.func('GetAsyncKeyState', 'short', ['int']);
const GetModuleHandleW = kernel32.func('GetModuleHandleW', 'intptr', ['str16']);

let hookHandle = null;
let callbackRef = null;
let eventHandler = null;

// Capture mode
let captureMode = false;
let captureCallback = null;

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

function startHook(onEvent) {
  eventHandler = onEvent;

  callbackRef = koffi.register((nCode, wParam, lParam) => {
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
          } else if (wParam === WM_MBUTTONDOWN) {
            if (captureCallback) {
              captureCallback({ modifier, trigger: 'middleClick' });
            }
            captureMode = false;
            captureCallback = null;
          }
        }
        // Normal mode
        else if (anyModifier && eventHandler) {
          if (wParam === WM_MOUSEWHEEL) {
            const data = koffi.decode(lParam, MSLLHOOKSTRUCT);
            const hiWord = (data.mouseData >>> 16) & 0xFFFF;
            const delta = hiWord > 32767 ? hiWord - 65536 : hiWord;
            const direction = delta > 0 ? 'up' : 'down';

            eventHandler({
              type: 'wheel',
              modifiers: mods,
              direction,
            });
          } else if (wParam === WM_MBUTTONDOWN) {
            eventHandler({
              type: 'middleClick',
              modifiers: mods,
            });
          }
        }
      }
    } catch (e) {
      console.error('Hook error:', e);
    }

    return CallNextHookEx(hookHandle, nCode, wParam, lParam);
  }, koffi.pointer(LowLevelMouseProc));

  const hModule = GetModuleHandleW(null);
  hookHandle = SetWindowsHookExW(WH_MOUSE_LL, callbackRef, hModule, 0);
  console.log('Hook installed:', !!hookHandle);
}

function stopHook() {
  if (hookHandle) {
    UnhookWindowsHookEx(hookHandle);
    hookHandle = null;
  }
  if (callbackRef) {
    koffi.unregister(callbackRef);
    callbackRef = null;
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

module.exports = { startHook, stopHook, startCapture, cancelCapture };
