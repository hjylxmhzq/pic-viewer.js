const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, '../demo/index.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  // Source maps support ('inline-source-map' also works)
  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, '../dist'),
    port: 8999,
    host: '0.0.0.0',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../demo/index.html'),
      filename: 'index.html'
    }),
    new CleanWebpackPlugin()
  ]
}