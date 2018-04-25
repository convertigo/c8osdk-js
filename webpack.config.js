const helpers = require('./config/helpers'),
    webpack = require('webpack');

module.exports = {

    resolve: {
        extensions: ['.ts', '.js']
    },

    entry: helpers.root('src/index.ts'),

    output: {
        path: helpers.root('bundles'),
        publicPath: '/',
        filename: 'index.umd.js',
        libraryTarget: 'umd',
        library: 'c8osdkvuejs'
    },

    // require those dependencies but don't bundle them
    externals: [/^\@angular\//, /^rxjs\//, 'pouchdb-browser'],

    module: {
        rules: [{
            enforce: 'pre',
            test: /\.ts$/,
            loader: 'tslint-loader',
            exclude: [helpers.root('node_modules')]
        }, {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader?declaration=false',
            exclude: [/\.e2e\.ts$/]
        }]
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        })
    ]
};