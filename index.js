"use strict";

const extend = require('lodash/object/extend');
const auth = require('./lib/auth');
const github = require('./lib/github');

let options = {
  onComplete: (diffs) => {
    console.log(JSON.stringify(diffs));
  }
};

module.exports = function (opts) {
  options = extend(options, opts);

  github.getOpenPRs(auth, options.limit, options.debug)
    .then(outputDiffs)
    .catch((err) => console.log(err));
};

function outputDiffs(diffs) {
  options.onComplete && options.onComplete(diffs);
}
