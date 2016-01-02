"use strict";

const helper = require("./lib/repo-helper");

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
  return helper.createGithubAuthentication(options.tokenName, options.tokenFile, options.scope)
    .then((credentials) => {
      return helper.getRepos(credentials, options.limit, options.debug)
        .then((repos) => {
          return Promise.all(repos.map((repo) => {
            return helper.getOpenPRs(credentials, repo, options.debug);
          }))
        });
    });
};
