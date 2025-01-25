path = require('path');

// This is require to use react-map-gl 6.x with maplibre
// See: https://github.com/visgl/react-map-gl/blob/v6.1.21/docs/get-started/get-started.md#using-with-a-mapbox-gl-fork
//
// In react-map-gl 7.x this is no longer needed: https://visgl.github.io/react-map-gl/docs/get-started
//
exports.onCreateWebpackConfig = ({stage, loaders, actions, getConfig}) => {
  actions.setWebpackConfig({
    devtool: 'eval-source-map',
    resolve: {
      alias: {
        'mapbox-gl': 'maplibre-gl',
      },
    },
  });

  if (stage === 'develop') {
    const config = getConfig();

    // Silence CSS ordering warnings, which aren't a risk with CSS Modules
    const miniCssExtractPlugin = config.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin',
    );
    if (miniCssExtractPlugin) {
      miniCssExtractPlugin.options.ignoreOrder = true;
    }

    actions.replaceWebpackConfig(config);
  }
};
