const path = require('path');
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
require("dotenv").config();

module.exports = () => {
  return {
    mode: 'development',
    entry: './src/tracker.ts',
    output: {
      filename: 'tracker.js',
      path: path.resolve(__dirname, 'build'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [{
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.client.json"
            }
          }],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts'],
    },
    plugins: [
      new webpack.DefinePlugin({
        'HOSTNAME': JSON.stringify(process.env.HOSTNAME),
        'SERVER_PORT': JSON.stringify(process.env.SERVER_PORT),
      }),
      new HtmlWebpackPlugin({
        template: './src/public/index.ejs',
        inject: false,
        trackerUrl: `${process.env.HOSTNAME}:${process.env.SERVER_PORT}/tracker`,
      }),
    ],
  };
};
