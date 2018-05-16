'use strict';

const { login } = require('../packtpub');
const { prompt } = require('inquirer');
const { storeCredentials } = require('../lib/auth');
const { wrap } = require('./helpers');
const chalk = require('chalk');

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
  desc: chalk.whiteBright('Log into packtpub.com'),
  handler: wrap(handler)
};

async function handler() {
  const { username, password } = await prompt(questions);
  await login(username, password);
  await storeCredentials(username, password);
  console.log('\nSuccessfully logged to packtpub.com.');
}
