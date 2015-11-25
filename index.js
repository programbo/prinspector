"use strict";

const auth = require('./lib/auth');
const github = require('./lib/github');

module.exports = function (options) {
  return github.getOpenPRs(auth, options.limit, options.debug);
};
