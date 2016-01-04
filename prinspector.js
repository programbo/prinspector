#!/usr/local/bin/node

const prettyjson = require("prettyjson");
const program = require("commander");
const prinspector = require("./index");
const print = require("repohelper/lib/print");
const tty = require("tty");

program
  .version("1.0.1")
  .usage("[options]")
  .option("-d, --debug", "Run in debug mode")
  .option("-l, --limit <n>", "Limit the maximum number of repositories", parseInt)
  .option("-p, --pretty", "Pretty output")
  .parse(process.argv);

/**
 * Request a list of all open PRs
 * @param  {String}  tokenName: Token Name
 * @param  {String}  tokenFile: File Name
 * @param  {Array}   scope:     List of priviledges required to access repos
 * @param  {Boolean} debug:     program.debug  [description]
 * @param  {Integer} limit:     program.limit} [description]
 * @return {Array}              All open pull requests
 */
prinspector({
  tokenName: "Demands",
  tokenFile: "token",
  scope: ["repo"],
  debug: program.debug,
  limit: program.limit
})
  .then((repos) => {
    const nonEmptyRepos = repos.filter((repo) => { return repo.length; });
    print(`Retrieved ${nonEmptyRepos.length} open pull-requests`, program.debug);
    console.log(program.pretty ? prettyjson.render(nonEmptyRepos) : JSON.stringify(nonEmptyRepos));
  })
  .catch((err) => console.log(err));
