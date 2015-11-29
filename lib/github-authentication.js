"use strict";

const fs = require("fs");
const clc = require("cli-color");
const gitUser = require("git-user");
const request = require("request");
const prompt = require("prompt");
const print = require("./print");

/**
 * Create an object containing a Person Access Token allowing an app access to Github.
 * @param  {String} appName   The name of the app to be used for the access token.
 * @param  {String} tokenFile The name of the file to read the token from, or
 *                            write a new token to.
 * @param  {Array} scope      An array of priviledge allowed to the token. See
 *                            https://developer.github.com/v3/oauth/#scopes
 * @return {Promise}          Resolves to an object containing the Personal
 *                            Access Token for the Github API.
 */
module.exports = function (appName, tokenFile, scope) {
  if (checkIfTokenFileExists(tokenFile)) {
    // A token file exists, so read it and return credentials
    return readTokenFile(tokenFile)
      .then(createGithubCredentials);
  }
  else {
    // A token file does NOT exist, so get the user to log in so an new token
    //  can be created.
    return getUserCredentials(appName)
      .then((user) => {
        return authorizeApp(user, appName, scope);
      })
      .then((token) => {
        // If a token is returned, write it to a file and then return the
        // authentication credentials.
        return createTokenFile(token, tokenFile)
          .then(createGithubCredentials)
      }, (errors) => {
        // The token already exists on the server. Remove it and try again.
        if (errors && appAlreadyExists(errors)) {
          print(clc.red.bold(`The app "${appName}" is already registered.`), true);
          print(['Visit ', clc.blue.underline("https://github.com/settings/tokens"), ` to delete "${appName}" from your `, clc.bold('Personal access tokens'), ', then run this script again.'], true);
        }
        process.exit(0);
      });
  }
};

/**
 * Tests if a list of authentication errors indicates that a Personal Access
 * Token with a given name already exists.
 * @param  {Array} errors A list of error objects
 * @return {Boolean}      Indicates if `errors` contains an "already_exists" error.
 */
function appAlreadyExists(errors) {
  return errors.some((error) => error.code === "already_exists");
}

/**
 * Tests if particular file name exists in the current working directory.
 * @param  {String} tokenFile The name of the file to look for
 * @return {Boolean}          Indicates the presence of a particular file name
 */
function checkIfTokenFileExists(tokenFile) {
  return fs.readdirSync(".").some((file) => file === tokenFile);
}

/**
 * Read the token string from a file
 * @param  {String} tokenFile The name of a file to read
 * @return {Promise}          Resolves to the 40-char token
 */
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

/**
 * Takes a token and returns an object used for authenticating with the Github API.
 * @param  {String} token 40-char token string
 * @return {Promise}      Resolves to an Object containing the token
 */
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

/**
 * Prompts the user to enter their Github login details.
 * @return {Promise} Resolves to an object containin a username and password
 */
function getUserCredentials() {
  return new Promise((resolve, reject) => {
    print(clc.bold("Sign in to authorize this app to find open pull-requests"), true);
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
        resolve(result);
      });
    });
  });
}

/**
 * Attempt to create a new Personal Access Token with the Github API.
 * @param  {Object} user    Object containing the username and password
 * @param  {String} appName Name of the token to be created_at
 * @param  {Array} scope    List of priviledges to allow the token (See
 *                          https://developer.github.com/v3/oauth/#scopes)
 * @return {Promise}        Resolves to a 40-char token string
 */
function authorizeApp(user, appName, scope) {
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
        scopes: scope,
        note: appName
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
        console.log(body.errors);
        reject(body.errors);
      }
    });
  });
}

/**
 * Write a token to a given file.
 * @param  {String} token     The token to save to a file
 * @param  {String} tokenFile Name of the file to create
 * @return {Promise}          Resolves back the token that was passed in
 */
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
