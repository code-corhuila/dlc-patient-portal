const path = require('node:path');
const { name } = require('./package.json');

module.exports = config => config.set({
  frameworks: ['jasmine'],
  plugins: [require('karma-jasmine'), require('karma-chrome-launcher'), require('karma-coverage')],
  reporters: ['progress', 'coverage'],
  browsers: ['ChromeHeadless'],
  coverageReporter: {
    dir: path.join(__dirname, 'coverage', name),
    subdir: '.',
    reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }],
    check: {
      emitWarning: false,
      global: { statements: 80, branches: 80, functions: 80, lines: 80 },
      each: { overrides: {
        '**/patients/model/patient-list-item.ts': { lines: 90 },
        '**/patients/domain/**/*.ts': { lines: 90 },
      } },
    },
  },
});
