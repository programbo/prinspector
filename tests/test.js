"use strict";
const expect = require("chai").expect;

describe("PRInspector", () => {
  describe("integration", () => {
    let program;
    before(() => {
      const child_process = require("child_process");
      program = child_process.spawn("./prinspector.js", ["-l", 2]);
    });
    it("should return an array", function (done) {
      this.timeout(0);
      let output = "";
      program.stdout.on("data", (data) => {
        output += data.toString();
      });
      program.on("exit", (exitCode) => {
        expect(exitCode).to.eql(0);
        const response = JSON.parse(output);
        expect(response).to.be.an.instanceof(Array);
        done();
      });
    });
  });
});
