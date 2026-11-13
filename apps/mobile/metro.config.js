const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
const sharedFile = path.resolve(workspaceRoot, "apps/server/src/shared/index.ts");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@shared") {
    return { type: "sourceFile", filePath: sharedFile };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
