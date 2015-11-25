'use strict';
const expect = require('chai').expect;

describe('PRInspector', () => {

  describe('print', () => {
    let stdoutWrite;
    let log;
    beforeEach(() => {
      stdoutWrite = process.stdout.write;
      process.stdout.write = (message) => {
        log.push(message);
        // stdoutWrite(message);
      };
    });
    beforeEach(() => log = []);
    afterEach(() => log = []);
    afterEach(() => process.stdout.write = stdoutWrite);
    const print = require('./lib/print');
    it('Should write to stdout', () => {
      print('Hello world', true);
      expect(log.slice(2).join('')).to.eql('Hello world\n');
    });
    it('should obey the conditional flag', () => {
      print('Hello world', false);
      expect(log.length).to.eql(0);
    });
    it('should concatenate an array', () => {
      print(['Hello', ' ', 'world'], true);
      expect(log.slice(2).join('')).to.eql('Hello world\n');
    });
  });

  describe('integration', () => {
    let program;
    before(() => {
      const child_process = require('child_process');
      program = child_process.spawn('./prinspector.js', ['-l', 1]);
    });
    it('should return an array', function (done) {
      this.timeout(0);
      let lastOutput;
      program.stdout.on('data', function(data) {
        lastOutput = data.toString();
      });
      program.on('exit', (exitCode) => {
        expect(exitCode).to.eql(0);
        const response = JSON.parse(lastOutput);
        expect(response).to.be.an.instanceof(Array);
        done();
      });
    });
  });
});
