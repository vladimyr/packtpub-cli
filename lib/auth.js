'use strict';

const netrc = require('./netrc');
const aes256 = require('aes256');

const machine = 'packtpub.com';
const key = 'AuZAGfKrwdrh4d2VAC51exVaHDDdZ15M';
const cipher = aes256.createCipher(key);

module.exports = {
  getCredentials,
  removeCredentials,
  storeCredentials
};

async function getCredentials() {
  const conf = await netrc.read();
  const auth = conf[machine];
  if (!auth) return auth;
  const password = cipher.decrypt(auth.password);
  return { username: auth.login, password };
}

async function storeCredentials(username, password) {
  password = cipher.encrypt(password);
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
