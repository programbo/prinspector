#!/usr/local/bin/node

const prettyjson = require("prettyjson");
const program = require("commander");
const prinspector = require("./index");
const print = require("./lib/print");
const tty = require("tty");

program
  .version("1.0.0")
  .usage("[options]")
  .option("-d, --debug", "Run in debug mode")
  .option("-l, --limit <n>", "Limit the maximum number of repositories", parseInt)
  .option("-p, --pretty", "Pretty output")
  .parse(process.argv);

prinspector({
  debug: program.debug,
  limit: program.limit,
  pretty: program.pretty
})
  .then((diffs) => {
    print(`Retrieved ${diffs.length} diffs`, program.debug);
    console.log(program.pretty ? prettyjson.render(diffs) : JSON.stringify(diffs));
  })
  .catch((err) => console.log(err));
