"use strict";

const extend = require('lodash/object/extend');
const auth = require('./lib/auth');
const github = require('./lib/github');
const print = require('./lib/print');

let options = {
  onComplete: (diffs) => {
    console.log(JSON.stringify(diffs));
  }
};

module.exports = function (opts) {
  options = extend(options, opts);

  github.setDebug(options.debug);
  github.setLimit(options.limit);

  github.authenticate(auth);
  const diffs = github.getRepos()
    .then(github.getPRs, handleError('getRepos'))
    .then(github.getLabels, handleError('getPRs'))
    .then(github.getDiffs, handleError('getLabels'));

  diffs.then(outputDiffs, handleError('getDiffs'));
};

function outputDiffs(diffs) {
  options.onComplete && options.onComplete(diffs);
}

function handleError(type) {
  return (err) => {
    console.error('ERROR:', type);
    console.error(err);
  }
}
