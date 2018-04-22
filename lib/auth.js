'use strict';

const netrc = require('./netrc');
const machine = 'packtpub.com';

module.exports = {
  getCredentials,
  removeCredentials,
  storeCredentials
};

async function getCredentials() {
  const conf = await netrc.read();
  const auth = conf[machine];
  if (!auth) return auth;
  return { username: auth.login, password: auth.password };
}

async function storeCredentials(username, password) {
  const conf = await netrc.read();
  conf[machine] = { login: username, password };
  await netrc.write(conf);
  return { username, password };
}

async function removeCredentials() {
  const conf = await netrc.read();
  const auth = conf[machine];
  if (!auth) return false;
  delete conf[machine];
  await netrc.write(conf);
  return true;
}
