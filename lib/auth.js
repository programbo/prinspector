'use strict';

const fs = require('fs');
const gitUser = require('git-user');
const request = require('request');
// const rl = require('readline').createInterface(process.stdin, process.stdout);
const prompt = require('prompt');
// const prompt = require('cli-prompt');

module.exports = function (tokenFile) {
  if (checkIfTokenFileExists(tokenFile)) {
    return getUserCredentials()
      .then(readAuthToken);
  }
  // else {
  //   return getUserCredentials()
      // .then(() => {
      //   return createTokenFile(tokenFile, 'test');
      // });
  // }
};

function checkIfTokenFileExists(tokenFile) {
  return fs.readdirSync('.').some((file) => file === tokenFile);
}

function readAuthToken(tokenFile) {
  return new Promise((resolve, reject) => {
    const token = fs.readFileSync('./token').toString().slice(0, 40);
    if (token && token.length == 40) {
      resolve(createGithubCredentials(token));
    } else {
      reject('Invalid token');
    }
  });
}

function createGithubCredentials(token) {
  return { type: 'oauth', token: token };
}

function createTokenFile(tokenFile, token) {
  return new Promise((resolve, reject) => {
    fs.writeFile(tokenFile, token, (err) => {
      if (err) {
          console.log(err);
          reject(err);
      }
      resolve(token);
    });
  });
}

function getAppCredentials(userCredentials) {
  console.log(userCredentials);
  return new Promise((resolve, reject) => {
    const prettyjson = require('prettyjson');

    var response = request.post('https://api.github.com/authorizations', {
      auth: {
        user: '',
        pass: '',
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
      return resolve(body);
    });
    /**
     * curl https://api.github.com/authorizations --user "programbo" --data '{"scopes":["repo","user","read:org"],"note":"PRInspector"}'
     */
     /**
      * {"id":25029382,"url":"https://api.github.com/authorizations/25029382","app":{"name":"Demands","url":"https://developer.github.com/v3/oauth_authorizations/","client_id":"00000000000000000000"},"token":"f0e40314cebde67dd772caef3fda7001881e6335","hashed_token":"7952ec94f93af224661a526309862431e2c3eee480eeaecb695dc3f7aa51917d","token_last_eight":"881e6335","note":"Demands","note_url":null,"created_at":"2015-11-27T07:39:23Z","updated_at":"2015-11-27T07:39:23Z","scopes":["repo"],"fingerprint":null}
      */
      /**
       * {"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
       */
    resolve('');
  });
}

function generateToken(tokenFile) {
  // TODO
  // return new Promise((resolve, reject) => {
  //   rl.question('Git username:', (answer) => {
  //     console.log(answer);
  //   });
  //
  // });
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
        //
        // Log the results.
        //
        console.log('Command-line input received:');
        console.log('  username: ' + result.username);
        console.log('  password: ' + result.password);
        resolve('token');
      });
      // TODO
      // prompt.multi([
      //   {
      //     key: 'Github username',
      //     default: email
      //   },
      //   {
      //     label: 'Github password (must be at least 5 characters)',
      //     key: 'password',
      //     type: 'password'
      //   },
      //   {
      //     label: 'is this ok?',
      //     type: 'boolean'
      //   }
      // ], console.log);
      // const schema = {
      //   properties: {
      //     username: {
      //       description: `Github username:`,
      //       default: email,
      //       required: true
      //     },
      //     password: {
      //       description: 'Github password:',
      //       hidden: true,
      //       required: true
      //     }
      //   }
      // };
      // prompt.start();
      // prompt.message = '';
      // prompt.delimiter = '';
      // prompt.get(schema, (err, result) => {
      //   resolve(result);
      // });

    })
  });
}
