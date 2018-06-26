module.exports = function(config) {
    var testWebpackConfig = require('./webpack.test.js');

    var configuration = {

        basePath: '',

        frameworks: ['jasmine'],

        // list of files to exclude
        exclude: [],

        /*
         * list of files / patterns to load in the browser
         *
         * we are building the test environment in ./spec-bundle.js
         */
        files: [ { pattern: './config/spec-bundle.js', watched: false } ],

        preprocessors: { './config/spec-bundle.js': ['coverage', 'webpack', 'sourcemap'] },

        // Webpack Config at ./webpack.test.js
        webpack: testWebpackConfig,

        coverageReporter: {
            type: 'in-memory'
        },

        remapCoverageReporter: {
            'text-summary': null,
            json: './coverage/coverage.json',
            html: './coverage/html'
        },

        // Webpack please don't spam the console when running in karma!
        webpackMiddleware: { stats: 'errors-only'},

        reporters: [ 'mocha', 'coverage', 'remap-coverage' ],

        mochaReporter: {
            ignoreSkipped: true
        },

        // web server port
        port: 9876,

        colors: true,

        /*
         * level of logging
         * possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
         */
        logLevel: config.LOG_INFO,

        autoWatch: false,

        browsers: [
            'Chrome', 'Firefox', 'IE'
        ],

        customLaunchers: {
            ChromeTravisCi: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            },
            sl_chrome: {
                base: 'SauceLabs',
                browserName: 'chrome',
                platform: 'Windows 7',
                version: '35'
              },
              sl_firefox: {
                base: 'SauceLabs',
                browserName: 'firefox',
                version: '30'
              },
              sl_ios_safari: {
                base: 'SauceLabs',
                browserName: 'iphone',
                platform: 'OS X 10.9',
                version: '7.1'
              },
              sl_ie_11: {
                base: 'SauceLabs',
                browserName: 'internet explorer',
                platform: 'Windows 8.1',
                version: '11'
              },
              sl_android: {
                base: 'SauceLabs',
                browserName: 'Browser',
                platform: 'Android',
                version: '4.4',
                deviceName: 'Samsung Galaxy S3 Emulator',
                deviceOrientation: 'portrait'
              }
        },

        singleRun: true
    };

    if (process.env.TRAVIS){
        configuration.browsers = [
            Object.keys(customLaunchers)
        ];
        configuration.reporters = ['dots', 'saucelabs'];
        configuration.singleRun = true;
    }

    config.set(configuration);
};