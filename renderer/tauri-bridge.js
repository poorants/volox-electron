// Volox — compatibility bridge.
//
// The renderer was written against Electron's `window.electronAPI` (contextBridge
// + ipcRenderer). This shim re-implements the exact same surface on top of the
// Tauri 2 global API (`window.__TAURI__`, enabled via `withGlobalTauri`), so the
// HTML/JS can stay essentially unchanged after the migration.
(function () {
  var T = window.__TAURI__;
  if (!T) {
    console.error('[volox] Tauri global API not found — is withGlobalTauri enabled?');
    return;
  }

  var invoke = (T.core && T.core.invoke) || T.invoke;
  var listen = (T.event && T.event.listen);

  // Synchronous best-effort platform (settings.html reads this at module load).
  var platform = /Mac/i.test(navigator.userAgent) ? 'darwin' : 'win32';

  function on(eventName, cb) {
    if (!listen) return Promise.resolve(function () {});
    return listen(eventName, function (e) { cb(e.payload); });
  }

  window.electronAPI = {
    platform: platform,

    // OSD
    onOsdUpdate: function (cb) { return on('osd-update', cb); },

    // Settings
    getSettings: function () { return invoke('get_settings'); },
    saveSettings: function (settings) { return invoke('save_settings', { settings: settings }); },

    // Shortcut capture
    startCapture: function (action) { return invoke('start_capture', { action: action }); },
    cancelCapture: function () { return invoke('cancel_capture'); },
    onCaptureResult: function (cb) { return on('capture-result', cb); },

    // Tray menu
    getTrayMenuState: function () { return invoke('get_volume_state'); },
    setVolume: function (vol) { return invoke('set_volume', { vol: vol }); },
    trayToggleMute: function () { return invoke('toggle_mute_from_tray'); },
    openSettings: function () { return invoke('open_settings'); },
    quitApp: function () { return invoke('quit_app'); },
    onTrayMenuUpdate: function (cb) { return on('tray-menu-action', cb); },

    // Theme
    getTheme: function () { return invoke('get_theme'); },
    setTheme: function (theme) { return invoke('set_theme', { theme: theme }); },
    onThemeChanged: function (cb) { return on('theme-changed', cb); },
    openThemePicker: function () { return invoke('open_theme_picker'); },

    // Auth
    getFirebaseConfig: function () { return invoke('get_firebase_config'); },
    getUser: function () { return invoke('get_user'); },
    signIn: function (user) { return invoke('auth_sign_in', { user: user }); },
    signOut: function () { return invoke('auth_sign_out'); },
    closeAuthWindow: function () { return invoke('close_auth_window'); },
    getSubscription: function () { return invoke('get_subscription'); },
    saveSubscription: function (sub) { return invoke('save_subscription', { sub: sub }); },
    openAuthWindow: function () { return invoke('open_auth_window'); },
    onAuthStateChanged: function (cb) { return on('auth-state-changed', cb); }
  };

  // The renderer closes panels with window.close(); route it through Tauri so the
  // native window actually closes regardless of webview behavior.
  window.close = function () { invoke('close_window'); };
})();
