const Store = require('electron-store').default;

const isDarwin = process.platform === 'darwin';

const DEFAULTS_WIN32 = {
  volumeUp: { modifier: 'alt', trigger: 'wheelUp' },
  volumeDown: { modifier: 'alt', trigger: 'wheelDown' },
  mute: { modifier: 'alt', trigger: 'middleClick' },
};

const DEFAULTS_DARWIN = {
  volumeUp: { modifier: 'alt', trigger: 'arrowUp' },
  volumeDown: { modifier: 'alt', trigger: 'arrowDown' },
  mute: { modifier: 'alt', trigger: 'keyM' },
};

const shortcutDefaults = isDarwin ? DEFAULTS_DARWIN : DEFAULTS_WIN32;

const schema = {
  shortcuts: {
    type: 'object',
    properties: {
      volumeUp: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: shortcutDefaults.volumeUp.trigger },
        },
        default: shortcutDefaults.volumeUp,
      },
      volumeDown: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: shortcutDefaults.volumeDown.trigger },
        },
        default: shortcutDefaults.volumeDown,
      },
      mute: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: shortcutDefaults.mute.trigger },
        },
        default: shortcutDefaults.mute,
      },
    },
    default: shortcutDefaults,
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
  theme: {
    type: 'string',
    enum: ['dark', 'light', 'cyber-pulse'],
    default: 'dark',
  },
  autoStart: {
    type: 'boolean',
    default: false,
  },
  user: {
    type: ['object', 'null'],
    properties: {
      uid: { type: 'string' },
      email: { type: 'string' },
      displayName: { type: 'string' },
      photoURL: { type: 'string' },
    },
    default: null,
  },
  subscription: {
    type: ['object', 'null'],
    properties: {
      plan: { type: 'string', enum: ['free', 'pro'], default: 'free' },
      status: { type: 'string', enum: ['active', 'expired', 'cancelled'], default: 'active' },
    },
    default: null,
  },
};

const store = new Store({ schema });

function getSettings() {
  return {
    shortcuts: store.get('shortcuts'),
    volume: store.get('volume'),
    osd: store.get('osd'),
    theme: store.get('theme'),
    autoStart: store.get('autoStart'),
  };
}

function saveSettings(settings) {
  if (settings.shortcuts) store.set('shortcuts', settings.shortcuts);
  if (settings.volume) store.set('volume', settings.volume);
  if (settings.osd) store.set('osd', settings.osd);
  if (settings.theme) store.set('theme', settings.theme);
  if (settings.autoStart !== undefined) store.set('autoStart', settings.autoStart);
}

function getTheme() {
  return store.get('theme');
}

function setTheme(theme) {
  store.set('theme', theme);
}

function getUser() {
  return store.get('user') || null;
}

function setUser(user) {
  if (user) {
    store.set('user', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  } else {
    store.delete('user');
  }
}

function getSubscription() {
  return store.get('subscription') || null;
}

function setSubscription(subscription) {
  if (subscription) {
    store.set('subscription', {
      plan: subscription.plan,
      status: subscription.status,
    });
  } else {
    store.delete('subscription');
  }
}

module.exports = { getSettings, saveSettings, getTheme, setTheme, getUser, setUser, getSubscription, setSubscription };
