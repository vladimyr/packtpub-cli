'use strict';

const { removeCredentials } = require('../lib/auth');
const { wrap } = require('./helpers.js');
const chalk = require('chalk');

module.exports = {
  command: 'logout',
  desc: chalk.whiteBright('Log out from packtpub.com'),
  handler: wrap(handler)
};

async function handler() {
  const removed = await removeCredentials();
  if (!removed) {
    console.error('You are not logged in!');
    return;
  }
  console.log('Logged out from packtpub.com');
}
