'use strict';

const { getCredentials } = require('../lib/auth');
const { wrap } = require('./helpers.js');
const chalk = require('chalk');

module.exports = {
  command: 'whoami',
  desc: chalk.whiteBright('Show who are you logged as'),
  handler: wrap(handler)
};

async function handler() {
  const creds = await getCredentials();
  if (!creds) {
    console.error('You are not logged in!');
    return;
  }
  console.log('Logged in as:', creds.username);
}
