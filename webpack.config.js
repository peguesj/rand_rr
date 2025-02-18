const path = require('path');

module.exports = {
  entry: {
    editor: './src/js/editor.js',
    render: './src/js/render.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@utils': path.resolve(__dirname, 'src/js/utils/')
    }
  }
};
