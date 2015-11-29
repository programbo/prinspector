"use strict";

const auth = require("./lib/auth");
const github = require("./lib/github");

/**
 * Read the list of open PRs from the Github API
 * @param  {Object} options tokenName: (String) Name of the Token
 *                          tokenFile: (String) A file to look for a token
 *                          scope: (Array) The priviledges for the token
 *                          limit: (Integer:optional) Number of repos to search
 *                          debug: (optional) Outputs comments at every step
 * @return {Array}          A list of all open pull requests
 */
module.exports = function (options) {
  return auth(options.tokenName, options.tokenFile, options.scope)
    .then((credentials) => {
      return github.getOpenPRs(credentials, options.limit, options.debug);
    });
};
