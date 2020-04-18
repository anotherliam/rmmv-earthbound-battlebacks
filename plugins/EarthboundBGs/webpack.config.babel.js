import webpack from 'webpack'
import path from 'path'
import BabiliPlugin from 'babili-webpack-plugin'
const SOURCE = path.join(__dirname, 'src')
const DESTINATION = path.join(__dirname, '../')
const ENV = 'development'
export default {
  context: __dirname,
  entry: {
    index: './src'
  },
  output: {
    path: DESTINATION,
    publicPath: '.',
    filename: 'EarthboundBG.js',
    chunkFilename: '[name]-[chunkhash].js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{
      test: SOURCE,
      use: 'babel-loader',
      exclude: /node_modules/
    }, {
      test: /\.dat$/,
      use: 'binary-loader',
      exclude: /node_modules/
    }]
  },
  optimization: {
    minimize: false
  },
  devtool: false,
  plugins: [
    // new webpack.optimize.OccurrenceOrderPlugin(),
    // new webpack.optimize.ModuleConcatenationPlugin(),
    // new BabiliPlugin()
  ]
}
