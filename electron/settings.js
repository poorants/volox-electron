const Store = require('electron-store').default;

const schema = {
  shortcuts: {
    type: 'object',
    properties: {
      volumeUp: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'wheelUp' },
        },
        default: { modifier: 'alt', trigger: 'wheelUp' },
      },
      volumeDown: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'wheelDown' },
        },
        default: { modifier: 'alt', trigger: 'wheelDown' },
      },
      mute: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'middleClick' },
        },
        default: { modifier: 'alt', trigger: 'middleClick' },
      },
    },
    default: {
      volumeUp: { modifier: 'alt', trigger: 'wheelUp' },
      volumeDown: { modifier: 'alt', trigger: 'wheelDown' },
      mute: { modifier: 'alt', trigger: 'middleClick' },
    },
  },
  volume: {
    type: 'object',
    properties: {
      step: { type: 'number', minimum: 1, maximum: 10, default: 2 },
    },
    default: { step: 2 },
  },
  osd: {
    type: 'object',
    properties: {
      duration: { type: 'number', default: 1500 },
    },
    default: { duration: 1500 },
  },
};

const store = new Store({ schema });

function getSettings() {
  return {
    shortcuts: store.get('shortcuts'),
    volume: store.get('volume'),
    osd: store.get('osd'),
  };
}

function saveSettings(settings) {
  if (settings.shortcuts) store.set('shortcuts', settings.shortcuts);
  if (settings.volume) store.set('volume', settings.volume);
  if (settings.osd) store.set('osd', settings.osd);
}

module.exports = { getSettings, saveSettings };
