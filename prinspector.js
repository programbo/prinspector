#!/usr/local/bin/node

const prettyjson = require('prettyjson');
const program = require('commander');
const Spinner = require('cli-spinner').Spinner;
const prinspector = require('./index');
const print = require('./lib/print');

const spinner = new Spinner('%s')
spinner.setSpinnerString(0);
spinner.start();

program
  .version('1.0.0')
  .usage('[options]')
  .option('-d, --debug', 'Run in debug mode')
  .option('-l, --limit <n>', 'Limit the maximum number of repositories', parseInt)
  .option('-p, --pretty', 'Pretty output')
  .parse(process.argv);

prinspector({
  debug: program.debug,
  limit: program.limit,
  pretty: program.pretty,
  onComplete: (diffs) => {
    spinner.stop(true);
    print(`Retrieved ${diffs.length} diffs`, program.debug);
    print(program.pretty ? prettyjson.render(diffs) : JSON.stringify(diffs), true);
  }
});
