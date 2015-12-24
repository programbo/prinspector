"use strict";

const auth = require("./github-authentication");
const pullRequests = require("./pull-requests");

module.exports = {
  auth: auth,
  setDebug: pullRequests.setDebugMode,
  setLimit: pullRequests.setRepoLimit,
  getOpenPRs: pullRequests.getOpenPRs,
  getRepos: pullRequests.getRepos
}
