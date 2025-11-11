const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// Impor InjectManifest, bukan GenerateSW
const { InjectManifest } = require('workbox-webpack-plugin'); 
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path'); // Kita butuh 'path'

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map', // Tambahkan source-map untuk produksi
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // Loader untuk ekstraksi CSS
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),

    new InjectManifest({
      swSrc: path.resolve(__dirname, 'src/scripts/sw.js'), // Path ke file sw.js manual kita
      swDest: 'sw.js', // Nama file service worker final di folder 'dist'
    }),
  ],
});