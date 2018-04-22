'use strict';

const { removeCredentials } = require('../lib/auth');

module.exports = {
  command: 'logout',
  desc: 'Log out from packtpub.com',
  handler
};

async function handler() {
  const removed = await removeCredentials();
  if (!removed) {
    console.error('\nYou are not logged in!');
    return;
  }
  console.log('\nLogged out from packtpub.com');
}
