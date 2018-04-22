'use strict';

const netrc = require('../lib/netrc');

module.exports = {
  command: 'logout',
  desc: 'Log out from packtpub.com',
  handler
};

async function handler() {
  const conf = await netrc.read();
  const credentials = conf['packtpub.com'];
  if (!credentials) {
    console.error('\nYou are not logged in!');
    return;
  }
  delete conf['packtpub.com'];
  await netrc.write(conf);
  console.log('\nLogged out from packtpub.com');
}
