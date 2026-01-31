const { globalShortcut } = require('electron');

const MODIFIER_MAP = { alt: 'Alt', ctrl: 'Ctrl', shift: 'Shift', meta: 'Super' };
const TRIGGER_MAP = {
  arrowUp: 'Up',
  arrowDown: 'Down',
  keyM: 'M',
};

let eventHandler = null;
let registeredAccelerators = [];
let captureMode = false;
let captureCallback = null;

function startHook(onEvent) {
  eventHandler = onEvent;
}

function bindShortcuts(shortcuts) {
  unbindAll();
  for (const [action, sc] of Object.entries(shortcuts)) {
    if (!sc || !sc.modifier || !sc.trigger) continue;
    const mod = MODIFIER_MAP[sc.modifier];
    const key = TRIGGER_MAP[sc.trigger];
    if (!mod || !key) continue;

    const accelerator = `${mod}+${key}`;
    try {
      globalShortcut.register(accelerator, () => {
        if (captureMode && captureCallback) {
          captureCallback({ modifier: sc.modifier, trigger: sc.trigger });
          captureMode = false;
          captureCallback = null;
          return;
        }
        if (eventHandler) {
          eventHandler({
            type: 'keyboard',
            action,
            modifiers: { [sc.modifier]: true },
          });
        }
      });
      registeredAccelerators.push(accelerator);
    } catch (e) {
      console.error(`Failed to register shortcut ${accelerator}:`, e);
    }
  }
  console.log('Shortcuts registered:', registeredAccelerators);
}

function unbindAll() {
  registeredAccelerators.forEach(a => {
    try { globalShortcut.unregister(a); } catch (_) {}
  });
  registeredAccelerators = [];
}

function stopHook() {
  unbindAll();
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

module.exports = { startHook, stopHook, startCapture, cancelCapture, bindShortcuts };
