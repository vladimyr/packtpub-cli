'use strict';

const { login } = require('../packtpub');
const { OperationalError } = require('bluebird');
const { prompt } = require('inquirer');
const { storeCredentials } = require('../lib/auth');
const chalk = require('chalk');

const isOperationalError = err => err instanceof OperationalError;
const notEmpty = input => input && input.length > 0;

const questions = [{
  type: 'input',
  name: 'username',
  message: 'Enter your username:',
  validate: notEmpty
}, {
  type: 'password',
  name: 'password',
  message: 'Enter your password:',
  validate: notEmpty,
  mask: '*'
}];

module.exports = {
  command: 'login',
  desc: 'Log into packtpub.com',
  handler
};

async function handler() {
  const { username, password } = await prompt(questions);
  try {
    await login(username, password);
    await storeCredentials(username, password);
    console.log('\nSuccessfully logged to packtpub.com.');
  } catch (err) {
    if (!isOperationalError(err)) throw err;
    console.error(chalk`\n{bgRed.white.bold Login error} ${err.message}`);
    process.exit(1);
  }
}
