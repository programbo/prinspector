"use strict";

const auth = require("./lib/auth");
const github = require("./lib/github");

module.exports = function (options) {
  return auth("Demands", "token").then((credentials) => {
    return github.getOpenPRs(credentials, options.limit, options.debug);
  });
};
