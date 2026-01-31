if (process.platform === 'win32') {
  module.exports = require('./win32');
} else if (process.platform === 'darwin') {
  module.exports = require('./darwin');
} else {
  module.exports = {
    startHook() {},
    stopHook() {},
    startCapture() {},
    cancelCapture() {},
  };
}
