'use strict';
const expect = require('chai').expect;

describe('PRInspector', () => {

  describe('print', () => {
    let stdoutWrite;
    let log;
    before(() => {
      stdoutWrite = process.stdout.write;
      process.stdout.write = (message) => {
        log.push(message);
      };
    });
    beforeEach(() => log = []);
    afterEach(() => log = []);
    after(() => process.stdout.write = stdoutWrite);
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
      expect(log.slice(-1).toString()).to.eql('Hello world\n');
    });
  });

  describe('integration', () => {
    let program;
    before(() => {
      const child_process = require('child_process');
      program = child_process.spawn('./prinspector.js', ['-l', 2]);
    });
    it('should return an array', function (done) {
      this.timeout(0);
      let lastOutput;
      program.stdout.on('data', (data) => {
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
