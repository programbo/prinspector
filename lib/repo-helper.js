"use strict";

const githubAuthentication = require("./github-authentication");
const pullRequests = require("./pull-requests");

module.exports = {
  createGithubAuthentication: githubAuthentication,
  setDebug: pullRequests.setDebugMode,
  setLimit: pullRequests.setRepoLimit,
  getOpenPRs: pullRequests.getOpenPRs,
  getRepos: pullRequests.getRepos
}
