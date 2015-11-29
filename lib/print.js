"use string";

const readline = require("readline");

module.exports = function print(message, condition) {
  if (typeof message === "undefined") {
    return;
  }
  if (condition) {
    if (typeof message === "string") {
      message = [message];
    }
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${message.join("")}\n`);
  }
};
