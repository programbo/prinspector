"use strict";

const clc = require('cli-color');
const GitHubApi = require("github");
const Q = require('q');
const print = require('./print');

let debug = false;
let limit = 0; // No limit
const github = new GitHubApi({
    version: "3.0.0"
});

function setDebugMode(mode) {
  debug = mode;
}

function setRepoLimit(repoLimit) {
  limit = repoLimit;
}

function authenticate(auth) {
  return Q.fcall(github.authenticate(auth));
}

function getRepos() {
  print(`Fetching repos (${limit ? 'First ' + limit : 'No limit'})`, debug);
  const deferred = Q.defer();
  github.repos.getAll({
    sort: 'pushed',
    per_page: limit || 100
  }, (err, repos) => {
    if (err) {
      return deferred.reject(err);
    }
    return deferred.resolve(repos);
  });
  return deferred.promise;
}

function getPRs(repos) {
  print(`Fetching PRs for ${repos.length} repos`, debug);
  return Q.all(repos.map(getPRsForRepo));
}

function getPRsForRepo(repo) {
  print(['Fetching PRs for ', clc.yellow.bold(`${repo.owner.login}/${repo.name}`)], debug);
  const deferred = Q.defer();
  github.pullRequests.getAll({
    user: repo.owner.login,
    repo: repo.name,
    state: 'open'
  }, (err, prs) => {
    if (err) {
      return deferred.reject(err);
    }
    prs = prs.filter((pr) => {
      return pr && pr.head;
    });
    return deferred.resolve(prs);
  });
  return deferred.promise;
}

function getLabels(prs) {
  return Q.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(populateLabelsForPR));
}

function populateLabelsForPR(pr) {
  print(['Get labels for PR ', clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  const deferred = Q.defer();
  github.issues.getIssueLabels({
    user: pr.head.user.login,
    repo: pr.head.repo.name,
    number: pr.number
  }, function (err, labels) {
    if (err && debug) {
      console.error(['Error fetching labels for PR ', clc.red.bold`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`]);
    }
    labels = labels || [];
    pr.labels = labels.map((label) => {
      return {
        name:label.name,
        color:label.color
      }
    });
    return deferred.resolve(pr);
  });
  return deferred.promise;
}

function getDiffs(prs) {
  print('Fetching diffs', debug);
  return Q.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(getDiffForPR));
}

function getDiffForPR(pr) {
  print(['Get diff for PR ', clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  const deferred = Q.defer();
  github.repos.compareCommits({
    user: pr.head.user.login,
    repo: pr.head.repo.name,
    head: pr.head.ref,
    base: pr.base.ref
  }, (err, diff) => {
    if (err && debug) {
      console.error(['Error fetching diffs for PR ', clc.red.bold`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`]);
    }
    diff.user = pr.head.user.login;
    diff.repo = pr.head.repo.name;
    diff.title = pr.title;
    diff.number = pr.number;
    diff.created_at = pr.created_at;
    diff.updated_at = pr.updated_at;
    diff.labels = pr.labels;
    return deferred.resolve(extractDiffData(diff));
  });
  return deferred.promise;
}

function extractDiffData(diff) {
  print(['Extract diff for ', clc.yellow.bold(`${diff.user}/${diff.repo}#${diff.number}`), clc.white.italic(` (${diff.title})`)], debug);
  return {
    user: diff.user,
    repo: diff.repo,
    title: diff.title,
    number: diff.number,
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
      }
    })
  };
}

module.exports = {
  setDebug: setDebugMode,
  setLimit: setRepoLimit,
  authenticate,
  getRepos,
  getPRs,
  getLabels,
  getDiffs
};
