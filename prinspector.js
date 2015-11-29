#!/usr/local/bin/node

const prettyjson = require('prettyjson');
const program = require('commander');
const Spinner = require('cli-spinner').Spinner;
const prinspector = require('./index');
const print = require('./lib/print');
const tty = require('tty');

program
  .version('1.0.0')
  .usage('[options]')
  .option('-d, --debug', 'Run in debug mode')
  .option('-l, --limit <n>', 'Limit the maximum number of repositories', parseInt)
  .option('-p, --pretty', 'Pretty output')
  .parse(process.argv);

// if (tty.isatty()) {
//   const spinner = new Spinner('%s')
//   spinner.setSpinnerString(0);
//   spinner.start();
// }
prinspector({
  debug: program.debug,
  limit: program.limit,
  pretty: program.pretty
})
  .then((diffs) => {
    // tty.isatty() && spinner.stop(true);
    print(`Retrieved ${diffs.length} diffs`, program.debug);
    console.log(program.pretty ? prettyjson.render(diffs) : JSON.stringify(diffs));
  })
  .catch((err) => console.log(err));