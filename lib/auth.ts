"use strict";

const fs = require("fs");
const clc = require("cli-color");
const gitUser = require("git-user");
const request = require("request");
const prompt = require("prompt");
const print = require("./print");

module.exports = function (appName, tokenFile) {
  if (checkIfTokenFileExists(tokenFile)) {
    return readTokenFile(tokenFile)
      .then(createGithubCredentials);
  }
  else {
    return getUserCredentials(appName)
      .then(authorizeApp)
      .then((token) => {
        return createTokenFile(token, tokenFile)
          .then(createGithubCredentials)
      }, (errors) => {
        if (errors && appAlreadyExists(errors)) {
          print(clc.red.bold(`The app "${appName}" is already registered.`), true);
          print(['Visit ', clc.blue.underline("https://github.com/settings/tokens"), ` to delete "${appName}" from your `, clc.bold('Personal access tokens'), ', then run this script again.'], true);
        }
        process.exit(0);
      });
  }
};

function appAlreadyExists(errors) {
  return errors.some((error) => error.code === "already_exists");
}

function checkIfTokenFileExists(tokenFile) {
  return fs.readdirSync(".").some((file) => file === tokenFile);
}

function readTokenFile(tokenFile) {
  return new Promise((resolve, reject) => {
    const token = fs.readFile(tokenFile, "utf8", (err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token.slice(0, 40));
    });
  });
}

function createGithubCredentials(token) {
  return new Promise((resolve, reject) => {
    if (token) {
      resolve({ type: "oauth", token: token });
    }
    else {
      reject("Missing token");
    }
  });
}

function getUserCredentials(appName) {
  return new Promise((resolve, reject) => {
    gitUser.email((err, email) => {
      const schema = {
        properties: {
          name: {
            pattern: /^[a-zA-Z\s\-]+$/,
            message: "Name must be only letters, spaces, or dashes",
            required: true
          },
          password: {
            hidden: true
          }
        }
      };
      prompt.message = "";
      prompt.delimiter = "";
      prompt.start();
      prompt.get({
        properties: {
          username: {
            description: "Github username",
            default: email,
            message: "Name must be only letters, spaces, or dashes",
            required: true
          },
          password: {
            description: "Github password",
            hidden: true
          }
        }
      }, (err, result) => {
        result.appName = appName;
        resolve(result);
      });
    });
  });
}

function authorizeApp(user) {
  return new Promise((resolve, reject) => {
    request.post("https://api.github.com/authorizations", {
      auth: {
        user: user.username,
        pass: user.password,
        sendImmediately: true
      },
      headers: {
        "content-type" : "application/x-www-form-urlencoded",
        "User-Agent": user.appName
      },
      body: JSON.stringify({
        scopes: ["repo"],
        note: user.appName
      })
    }, (err, response, body) => {
      if (err) {
        reject(err);
      }
      body = JSON.parse(body);
      if (body.token) {
        resolve(body.token);
      }
      else if(body.errors) {
        reject(body.errors);
        /**
         * {"message":"Validation Failed","errors":[{"resource":"OauthAccess","code":"already_exists","field":"description"}],"documentation_url":"https://developer.github.com/v3/oauth_authorizations/#create-a-new-authorization"}
         */
      }
    });
  });
}

function createTokenFile(token, tokenFile) {
  return new Promise((resolve, reject) => {
    fs.writeFile(tokenFile, token, (err) => {
      if (err) {
          reject(err);
      }
      resolve(token);
    });
  });
}
