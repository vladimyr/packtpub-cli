'use strict';

const { fetchBook } = require('../packtpub');
const { getCredentials } = require('../lib/auth');
const { OperationalError } = require('bluebird');
const chalk = require('chalk');

const isOperationalError = err => err instanceof OperationalError;

module.exports = {
  command: 'view-offer',
  desc: 'Show daily offer',
  handler
};

async function handler() {
  const auth = await getCredentials();
  if (!auth) {
    console.error('\nYou are not logged in!');
    return;
  }
  try {
    const book = await fetchBook(auth);
    console.log('\nDaily offer:');
    console.log(chalk`\n  {bold # ${book.title}}\n  {green ${book.url}}`);
  } catch (err) {
    if (!isOperationalError(err)) throw err;
    console.error(chalk`\n{bgRed.white.bold Error} ${err.message}`);
    process.exit(1);
  }
}
