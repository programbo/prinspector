'use strict';

const fs = require('fs');

module.exports = function (tokenFile) {
  return readAuthToken(tokenFile);
};

function readAuthToken(tokenFile) {
  return new Promise((resolve, reject) => {
    if (fs.readdirSync('.').some((file) => file === tokenFile)) {
      const token = fs.readFileSync('./token').toString().slice(0, 40);
      if (token && token.length == 40) {
        resolve(makeCredentials(token));
      } else {
        reject('Invalid token');
      }
    }
    else {
      createNewToken(tokenFile);
    }
  });
}

function makeCredentials(token) {
  return { type: 'oauth', token: token };
}

function createNewToken(tokenFile) {
  // TODO
}
