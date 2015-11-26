"use strict";

const clc = require('cli-color');
const extend = require('lodash/object/extend');
const GitHubApi = require("github");
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

function getOpenPRs(auth, repoLimit, debugEnabled) {
  setRepoLimit(repoLimit);
  setDebugMode(debugEnabled);
  return authenticate(auth)
    .then(getRepos)
    .then(getPRs, handleError('getRepos'))
    .then(getLabels, handleError('getPRs'))
    .then(getDiffs, handleError('getLabels'));
}

function authenticate(auth) {
  return new Promise((resolve, reject) => {
    github.authenticate(auth);
    resolve();
  });
}

function getRepos() {
  print(`Fetching repos (${limit ? 'First ' + limit : 'No limit'})`, debug);
  return new Promise((resolve, reject) => {
    github.repos.getAll({
      sort: 'pushed',
      per_page: limit || 100
    }, (err, repos) => {
      if (err) {
        return reject(err);
      }
      return resolve(repos);
    });
  });
}

function getPRs(repos) {
  print(`Fetching PRs for ${repos.length} repos`, debug);
  return Promise.all(repos.map(getPRsForRepo));
}

function getPRsForRepo(repo) {
  print(['Fetching PRs for ', clc.yellow.bold(`${repo.owner.login}/${repo.name}`)], debug);
  return new Promise((resolve, reject) => {
    github.pullRequests.getAll({
      user: repo.owner.login,
      repo: repo.name,
      state: 'open'
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

function getLabels(prs) {
  return Promise.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(populateLabelsForPR));
}

function populateLabelsForPR(pr) {
  print(['Get labels for PR ', clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  return new Promise((resolve, reject) => {
    github.issues.getIssueLabels({
      user: pr.base.user.login,
      repo: pr.base.repo.name,
      number: pr.number
    }, function (err, labels) {
      if (err && debug) {
        print(['Error fetching labels for PR ', clc.red.bold`${pr.base.user.login}/${pr.base.repo.name}#${pr.number}`], debug);
      }
      labels = labels || [];
      pr.labels = labels.map((label) => {
        return {
          name:label.name,
          color:label.color
        }
      });
      return resolve(pr);
    });
  });
}

function getDiffs(prs) {
  print('Fetching diffs', debug);
  return Promise.all(prs.reduce((flattenedPRs, pr) => {
    if (pr) {
      return flattenedPRs.concat(pr);
    }
  }, []).map(getDiffForPR));
}

function getDiffForPR(pr) {
  print(['Get diff for PR ', clc.yellow.bold(`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`)], debug);
  return new Promise((resolve, reject) => {
    github.repos.compareCommits({
      user: pr.head.user.login,
      repo: pr.head.repo.name,
      head: pr.head.ref,
      base: pr.base.ref
    }, (err, diff) => {
      if (err && debug) {
        print(['Error fetching diffs for PR ', clc.red.bold`${pr.head.user.login}/${pr.head.repo.name}#${pr.number}`], debug);
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

function extractDiffData(diff) {
  print(['Extract diff for ', clc.yellow.bold(`${diff.user}/${diff.repo}#${diff.number}`), clc.white.italic(` (${diff.title})`)], debug);
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
        patch: analyzePatch(file.patch || '')
      }
    })
  };
}

function analyzePatch(patch) {
  patch = patch.split('\n').reduce((reducedPatch, currentLine) => {
    if (currentLine.match(/^[-+]/)) {
      return reducedPatch.concat(currentLine.replace(/^[-+]+\s*/, ''));
    }
    return reducedPatch;
  }, []);
  return {
    lines: patch.length,
    chars: patch.join('').length
  }
}

function handleError(type) {
  return (err) => {
    console.error('ERROR:', type);
    console.error(err);
  }
}

module.exports = {
  setDebug: setDebugMode,
  setLimit: setRepoLimit,
  getOpenPRs
};
