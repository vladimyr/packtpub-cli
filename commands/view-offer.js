'use strict';

const { fetchBook } = require('../packtpub');
const { OperationalError } = require('bluebird');
const chalk = require('chalk');
const netrc = require('../lib/netrc');

const isOperationalError = err => err instanceof OperationalError;

module.exports = {
  command: 'view-offer',
  desc: 'Show daily offer',
  handler
};

async function handler() {
  const conf = await netrc.read();
  const auth = conf['packtpub.com'];
  if (!auth) {
    console.error('\nYou are not logged in!');
    return;
  }
  try {
    const options = { username: auth.login, password: auth.password };
    const book = await fetchBook(options);
    console.log('\nDaily offer:');
    console.log(chalk`\n  {bold # ${book.title}}\n  {green ${book.url}}`);
  } catch (err) {
    if (!isOperationalError(err)) throw err;
    console.error(chalk`\n{bgRed.white.bold Error} ${err.message}`);
    process.exit(1);
  }
}
