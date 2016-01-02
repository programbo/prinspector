"use strict";

const clc = require("cli-color");
const extend = require("lodash/object/extend");
const GitHubApi = require("github");
const print = require("./print");

let debug = false;
let limit = 0; // No limit
const github = new GitHubApi({
    version: "3.0.0"
});

/**
 * Toggles debug mode.
 * @param {Boolean} mode Sets the debug state
 */
function setDebugMode(mode) {
  debug = mode;
}

/**
 * Sets the max. number of repositories to query for open PRs.
 * @param {Integer} repoLimit Number of repos to query
 */
function setRepoLimit(repoLimit) {
  limit = repoLimit;
}

/**
 * Get a list of all open pull requests.
 * @param  {Object}  auth         Credentials containing an auth token
 * @param  {Object}  repo         The repo from which to get the Open PRs
 * @param  {Boolean} debugEnabled Set the debug state
 * @return {Promise}              Resolves to a list of all open pull-requests
 */
function getOpenPRs(auth, repo, debugEnabled) {
  setDebugMode(debugEnabled);
  return authenticate(auth)
    .then(function () {
      return getPRsForRepo(repo)
        .then(getLabels, handleError("getPRs"))
        .then(getDiffs, handleError("getLabels"));
    }, handleError("authenticate"));
}

/**
 * Initialize and authenticate the github API with,
 * @param  {Object} auth Credentials containing an auth token
 * @return {Promise}     Only resolves to continue the async flow
 */
function authenticate(auth) {
  return new Promise((resolve, reject) => {
    github.authenticate(auth);
    resolve();
  });
}

/**
 * Retrieves a list of repositories (All or limited).
 * @param  {Object}  auth         Credentials containing an auth token
 * @param  {Integer} repoLimit    Max. number of repos to query for PRs
 * @param  {Boolean} debugEnabled Set the debug state
 * @return {Promise}              Array of repositories
 */
function getRepos(auth, repoLimit, debugEnabled) {
  setRepoLimit(repoLimit);
  setDebugMode(debugEnabled);
  print(`Fetching repos (${limit ? "First " + limit : "No limit"})`, debug);
  return authenticate(auth)
  .then(() => {
    return new Promise((resolve, reject) => {
      github.repos.getAll({
        sort: "pushed",
        per_page: limit || 100
      }, (err, repos) => {
        if (err) {
          return reject(err);
        }
        return resolve(repos);
      });
    });
  })
}

/**
 * Fetch open pull requests for a single repository
 * @param  {Object}  repo Repository metadata
 * @return {Promise}      Resolves to a list of pull requests
 */
function getPRsForRepo(repo) {
  print(["Fetching PRs for ", clc.yellow.bold(`${repo.owner.login}/${repo.name}`)], debug);
  return new Promise((resolve, reject) => {
    github.pullRequests.getAll({
      user: repo.owner.login,
      repo: repo.name,
      state: "open"
    }, (err, prs) => {
      if (err) {
        return reject(err);
      }
      prs = prs.filter((pr) => {
        return pr && pr.head;
      });
      return resolve(prs);
    });
  });
}

/**
 * Fetch labels for a list of pull-requests
 * @param  {Array}  repos List of pull-requests
 * @return {Promise}      Resolves to an array of PRs containing labels
 */
function getLabels(prs) {
  return Promise.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(populateLabelsForPR));
}

/**
 * Fetch a list of labels for a single pull-request
 * @param  {Object}  pr Pull-request metadata
 * @return {Promise}    Resolves to an array of labels
 */
function populateLabelsForPR(pr) {
  print(["Get labels for PR ", clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  return new Promise((resolve, reject) => {
    github.issues.getIssueLabels({
      user: pr.base.user.login,
      repo: pr.base.repo.name,
      number: pr.number
    }, function (err, labels) {
      if (err && debug) {
        print(["Error fetching labels for PR ", clc.red.bold`${pr.base.user.login}/${pr.base.repo.name}#${pr.number}`], debug);
      }
      labels = labels || [];
      pr.labels = labels.map((label) => {
        return {
          name:label.name,
          color:label.color
        };
      });
      return resolve(pr);
    });
  });
}

/**
 * Fetch diffs for a list of pull-requests
 * @param  {Array}  repos List of pull-requests
 * @return {Promise}      Resolves to an array of PRs containing diff infomation
 */
function getDiffs(prs) {
  print("Fetching diffs", debug);
  return Promise.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(getDiffForPR));
}

/**
 * Fetch the diff for a single pull-request
 * @param  {Object}  pr Pull-request metadata
 * @return {Promise}    Resolves to an array of labels
 */
function getDiffForPR(pr) {
  print(["Get diff for PR ", clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  return new Promise((resolve, reject) => {
    github.repos.compareCommits({
      user: pr.head.user.login,
      repo: pr.head.repo.name,
      head: pr.head.ref,
      base: pr.base.ref
    }, (err, diff) => {
      if (err && debug) {
        print(["Error fetching diffs for PR ", clc.red.bold`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`], debug);
      }
      diff.user = pr.head.user.login;
      diff.repo = pr.head.repo.name;
      diff.title = pr.title;
      diff.number = pr.number;
      diff.link = pr._links.html.href;
      diff.created_at = pr.created_at;
      diff.updated_at = pr.updated_at;
      diff.labels = pr.labels;
      return resolve(extractDiffData(diff));
    });
  });
}

/**
 * Refine a complete diff down to its useful information
 * @param  {Object} diff Too much information about a diff
 * @return {Object}      Just enough information about a diff
 */
function extractDiffData(diff) {
  print(["Extract diff for ", clc.yellow.bold(`${diff.user}/${diff.repo}#${diff.number}`), clc.white.italic(` (${diff.title})`)], debug);
  return {
    user: diff.user,
    repo: diff.repo,
    title: diff.title,
    number: diff.number,
    link: diff.link,
    created_at: diff.created_at,
    updated_at: diff.updated_at,
    labels: diff.labels,
    ahead_by: diff.ahead_by,
    behind_by: diff.behind_by,
    status: diff.status,
    total_commits: diff.total_commits,
    author: {
      login: diff.merge_base_commit.author.login,
      avatar_url: diff.merge_base_commit.author.avatar_url,
    },
    files: diff.files.map((file) => {
      return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: analyzePatch(file.patch || "")
      };
    })
  };
}

/**
 * Reduce a patch down to just changed lines
 * @param  {String} patch The complete patch with surrounding context
 * @return {Object}       Stats about the changed lines
 */
function analyzePatch(patch) {
  patch = patch.split("\n").reduce((reducedPatch, currentLine) => {
    if (currentLine.match(/^[-+]/)) {
      return reducedPatch.concat(currentLine.replace(/^[-+]+\s*/, ""));
    }
    return reducedPatch;
  }, []);
  return {
    lines: patch.length,
    chars: patch.join("").length
  };
}

/**
 * Create a new error handler of a given type
 * @param  {String}   type The type of error to display
 * @return {Function}      Error logger
 */
function handleError(type) {
  return (err) => {
    console.error("ERROR:", type);
    console.error(err);
  };
}

module.exports = {
  setDebug: setDebugMode,
  setLimit: setRepoLimit,
  getOpenPRs,
  getRepos
};
