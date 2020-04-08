const { ios } = require("@raydeck/react-native-utilities");
const { join } = require("path");

var pbxproj = require("@raydeck/xcode");
const { writeFileSync, existsSync, copyFileSync } = require("fs");

//Get my directory
module.exports = (path = process.cwd()) => {
  const pbxProjPath = ios.getPBXProj();
  const iosPath = join(path, "ios");
  const appDelegateName = "AppDelegate.swift";
  const bridgingHeaderName = "swift-Bridging-Header.h";
  const templatesPath = join(__dirname, "..", "templates");
  const addSwiftDebugFlag = require("./addSwiftDebugFlag");
  const setPlistColor = require("./setPListColor");
  const properties = {
    SWIFT_VERSION: "4.0",
    SWIFT_OBJC_BRIDGING_HEADER: bridgingHeaderName,
  };
  const appDelegateTargetPath = join(iosPath, appDelegateName);
  const bridgingHeaderTargetPath = join(iosPath, bridgingHeaderName);
  const appDelegateSourcePath = join(templatesPath, appDelegateName);
  const bridgingHeaderSourcePath = join(templatesPath, bridgingHeaderName);
  const removes = ["AppDelegate.h", "AppDelegate.m", "main.m"];
  const adds = {
    [appDelegateName]: appDelegateTargetPath,
    [bridgingHeaderName]: bridgingHeaderTargetPath,
  };
  if (!existsSync(appDelegateTargetPath)) {
    copyFileSync(appDelegateSourcePath, appDelegateTargetPath);
    copyFileSync(bridgingHeaderSourcePath, bridgingHeaderTargetPath);
    copyFileSync(appDelegateSourcePath, appDelegateTargetPath);
    copyFileSync(bridgingHeaderSourcePath, bridgingHeaderTargetPath);
    var proj = pbxproj.project(pbxProjPath);
    proj.parseSync();
    const fp = proj.getFirstProject();
    Object.keys(adds).forEach((fileName) => {
      const path = adds[fileName];
      let file = proj.addResourceFile(path, null, fp);
      if (!file) {
        console.log("Looks like the file is already here - aborting", fileName);
        return;
      }
      file.uuid = proj.generateUuid();
      const nts = proj.pbxNativeTargetSection();
      for (var key in nts) {
        if (key.endsWith("_comment")) continue;
        const target = proj.pbxTargetByName(nts[key].name);
        file.target = key;
        proj.addToPbxBuildFileSection(file); // PBXBuildFile
        proj.addToPbxSourcesBuildPhase(file);
      }
    });
    removes.forEach((key) => proj.removeSourceFile(key, null, fp));
    Object.keys(properties).forEach((key) => {
      proj.addBuildProperty(key, properties[key]);
    });
    const out = proj.writeSync();
    if (out) writeFileSync(pbxProjPath, out);
  } else {
    console.log(appDelegateName + " is already in " + iosPath + ": aborting");
  }
  addSwiftDebugFlag(process.cwd());
  setPlistColor();
};
