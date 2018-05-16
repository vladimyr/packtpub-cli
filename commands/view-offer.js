'use strict';

const { fetchBook } = require('../packtpub');
const { getCredentials } = require('../lib/auth');
const { wrap } = require('./helpers');
const chalk = require('chalk');
const opn = require('opn');

const options = {
  w: {
    alias: 'web',
    type: 'boolean',
    describe: 'Open daily offer in a web browser'
  }
};

module.exports = {
  command: 'view-offer',
  desc: chalk.whiteBright('Show daily offer'),
  builder: options,
  handler: wrap(handler)
};

async function handler({ web }) {
  const auth = await getCredentials();
  if (!auth) {
    console.error('You are not logged in!');
    return;
  }
  const book = await fetchBook(auth);
  if (web) return opn(book.url);
  console.log(chalk`\n  {underline Daily offer:}`);
  console.log(chalk`\n  {bold # ${book.title}}\n  {green ${book.url}}\n`);
}
