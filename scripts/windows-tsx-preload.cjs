// Work around rare Windows/libuv userInfo failures encountered by tsx in constrained environments.
const os = require('node:os');
const { syncBuiltinESMExports } = require('node:module');
const originalUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try { return originalUserInfo(...args); }
  catch { return { username: process.env.USERNAME || 'techlabs', uid: -1, gid: -1, shell: null, homedir: process.env.USERPROFILE || process.cwd() }; }
};
syncBuiltinESMExports();
