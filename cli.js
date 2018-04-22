#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const alias = { h: 'help', v: 'version' };

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .strict()
  .alias(alias)
  .commandDir('commands')
  .demandCommand(1, 'You need at least one command before moving on')
  .recommendCommands()
  .fail(onError)
  .help()
  .argv;

function onError(msg, err, yargs) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  yargs.showHelp();
  if (msg) console.error(chalk.bold(msg));
  process.exit(1);
}
