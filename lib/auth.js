'use strict';

const fs = require('fs');
const gitUser = require('git-user');
const request = require('request');
const prompt = require('prompt');

module.exports = function (tokenFile) {
  if (checkIfTokenFileExists(tokenFile)) {
    return readAuthToken();
  }
  else {
    return getUserCredentials()
      .then(authorizeApp)
      .then(createTokenFile)
      .then(readAuthToken);
  }
};

function checkIfTokenFileExists(tokenFile) {
  return fs.readdirSync('.').some((file) => file === tokenFile);
}

function createGithubCredentials(token) {
  return { type: 'oauth', token: token };
}

function readAuthToken(token) {
  return new Promise((resolve, reject) => {
    if (token) {
      resolve(createGithubCredentials(token));
    }
    else {
      token = fs.readFileSync('./token').toString().slice(0, 40);
      console.log('token', token);
      if (token && token.length == 40) {
        resolve(createGithubCredentials(token));
      } else {
        reject('Invalid token');
      }
    }
  });
}

function getUserCredentials() {
  return new Promise((resolve, reject) => {
    gitUser.email((err, email) => {
      const schema = {
        properties: {
          name: {
            pattern: /^[a-zA-Z\s\-]+$/,
            message: 'Name must be only letters, spaces, or dashes',
            required: true
          },
          password: {
            hidden: true
          }
        }
      };
      prompt.message = '';
      prompt.delimiter = '';
      prompt.start();
      prompt.get({
        properties: {
          username: {
            description: 'Github username',
            default: email,
            message: 'Name must be only letters, spaces, or dashes',
            required: true
          },
          password: {
            description: 'Github password',
            hidden: true
          }
        }
      }, (err, result) => {
        resolve(result);
      });
    })
  });
}

function authorizeApp(user) {
  return new Promise((resolve, reject) => {
    request.post('https://api.github.com/authorizations', {
      auth: {
        user: user.username,
        pass: user.password,
        sendImmediately: true
      },
      headers: {
        'content-type' : 'application/x-www-form-urlencoded',
        'User-Agent': 'demands'
      },
      body: JSON.stringify({
        scopes: ['repo'],
        note: 'Demands'
      })
    }, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      body = JSON.parse(body);
      if (body.token) {
        return resolve(body.token);
      }
      else {
        console.log(body);
        /**
         * {"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
         */
      }
    });
  });
}

function createTokenFile(token) {
  console.log('token:', token);
  return new Promise((resolve, reject) => {
    fs.writeFile('token', token, (err) => {
      if (err) {
          reject(err);
      }
      resolve(token);
    });
  });
}
