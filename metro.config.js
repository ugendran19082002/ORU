const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    (moduleName === "react-native-maps" ||
      moduleName.startsWith("react-native-maps/"))
  ) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
