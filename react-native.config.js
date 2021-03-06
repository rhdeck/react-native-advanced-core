const {
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
  renameSync,
} = require("fs");
const promote = require("promote-peer-dependencies");
const { join } = require("path");
const { sync: glob } = require("glob");
const yarnif = require("yarnif");
const inquirer = require("inquirer");
const hexrgb = require("hex-rgb");
const { spawnSync, execSync } = require("child_process");
const setSwiftBase = require("./lib/set-swift-base");
const { ios, android } = require("@raydeck/react-native-utilities");
module.exports = {
  commands: [
    {
      name: "advanced-link",
      description: "Initialize react-native-kotlin configuration and packages",
      options: [
        { name: "--ios-only", description: "link ios project components only" },
        { name: "--android-only", description: "link android components only" },
        { name: "--skip-peers", description: "Skip linking peer dependencies" },
        { name: "--skip-podlink", description: "Skip cocoapod linking" },
      ],
      func: async (
        _,
        __,
        {
          iosOnly,
          androidOnly,
          jsOnly,
          skipPeers,
          skipPodlink,
          path = process.cwd(),
        }
      ) => {
        if (!ios && androidOnly) {
          console.error("ios-only and android-only are mutually exclusive");
          process.exit(1);
        }
        const doIos = !androidOnly && !jsOnly;
        const doAndroid = !iosOnly && !jsOnly;
        //#region android
        if (!iosOnly) {
          //replace MainApplication.java
          const maPaths = glob(
            join(
              process.cwd(),
              "android",
              "app",
              "src",
              "main",
              "**",
              "MainApplication.java"
            )
          );
          const maPath = maPaths[0];
          const txt = readFileSync(maPath, { encoding: "utf8" });
          if (!txt.includes("RNKPackage")) {
            const lines = txt.split("\n");
            const packageLine = lines.find((line) => line.includes("package "));
            const templatePath = join(
              __dirname,
              "templates",
              "MainApplication.java"
            );
            const maTemplate = readFileSync(templatePath, { encoding: "utf8" });
            writeFileSync(maPath, [packageLine, maTemplate].join("\n"));
          }

          const macPaths = glob(
            join(
              process.cwd(),
              "android",
              "app",
              "src",
              "main",
              "**",
              "MainActivity.java"
            )
          );
          const macPath = macPaths[0];
          let macText = readFileSync(macPath, { encoding: "utf8" });
          const oldText = "import com.facebook.react.ReactActivity;";
          const newText = "import com.rna.core.RNKActivity;";
          if (!macText.includes(newText)) {
            if (macText.includes(oldText)) {
              macText = macText.replace(oldText, newText);
            }
            const olddef = "public class MainActivity extends ReactActivity";
            const newdef = "public class MainActivity extends RNKActivity";
            writeFileSync(macPath, macText.replace(olddef, newdef));
          }
        }
        //#endregion
        //#region ios predeps
        if (doIos) {
          if (!skipPodlink) {
            console.log("Linking pods");
            execSync("(cd " + join(process.cwd(), "ios") + " && pod install)", {
              stdio: "inherit",
            });
          } else console.log("Skipping podlink");

          console.log("Checking AppDelegate base");
          setSwiftBase();
        }
        //#endregion
        //walk dependencies
        const { dependencies = {}, devDependencies = {} } = JSON.parse(
          readFileSync(join(process.cwd(), "package.json"))
        );
        const deps = Object.keys({ ...dependencies, ...devDependencies });
        //find hooks
        let depinfo = [];
        deps.forEach((dep) => {
          //find the package.json
          let packagePath;
          let path = process.cwd();
          while (!packagePath) {
            if (path === "/" || !existsSync(path))
              throw "Couldnot find dependency " + dep;
            const temp = join(path, "node_modules", dep);
            if (existsSync(temp)) {
              packagePath = temp;
            } else {
              path = join(path, "..");
            }
          }

          const kpath = join(packagePath, "react-native.config.js");
          if (existsSync(kpath)) {
            // const thisDepInfo = {}
            const {
              advanced: { prelink, postlink, startupClasses } = {},
            } = require(kpath);
            depinfo.push({
              packagePath,
              prelink,
              postlink,
              startupClasses,
              name: dep,
            });
          }
        });
        if (!skipPeers) {
          console.log("Promoting peer dependencies");
          if (
            depinfo
              .map(({ packagePath }) =>
                promote(packagePath, process.cwd(), false)
              )
              .filter(Boolean).length
          )
            yarnif.install();
        } else console.log("Skipping peer dependencies");

        const finalStartupClasses = depinfo
          .flatMap(({ startupClasses }) => startupClasses)
          .filter(Boolean);
        for (const { prelink, name } of depinfo) {
          if (prelink) {
            console.log("Running prelink for " + name);
            await prelink({ iosOnly, androidOnly, jsOnly, skipPeers, path });
          }
        }
        //#region ios
        if (doIos) {
          console.log(
            "Updating startup classes (" + finalStartupClasses.join(",") + ")"
          );
          ios.setPlistValue("RNSRClasses", finalStartupClasses);
        }
        //#endregion
        for (const { postlink, name } of depinfo) {
          if (postlink) {
            console.log("Running postlink for " + name);
            await postlink({ androidOnly, iosOnly, skipPeers, jsOnly, path });
          }
        }
      },
    },
    {
      name: "bgcolor [newcolor]",
      description: "Set background color for application",
      func: (newcolor) => {
        if (newcolor && typeof newcolor !== "string") {
          newcolor = newcolor[0];
        }
        const pp = join(process.cwd(), "package.json");
        const p = require(pp);
        if (typeof newcolor !== "undefined") {
          p.backgroundColor = newcolor;
          fs.writeFileSync(pp, JSON.stringify(p, null, 2));
          require("./lib/setPListColor")();
          console.log("Saved and applied color", newcolor);
          return;
        }
        defColor = "";
        if (p.backgroundColor) {
          defColor = p.backgroundColor;
        }

        inquirer
          .prompt({
            name: "bgcolor",
            message:
              "What color do you want for your default background? (as Hex value)",
            default: defColor,
            validate: (answer) => {
              try {
                return hexrgb(answer) ? true : false;
              } catch (e) {
                return false;
              }
            },
          })
          .then((answers) => {
            p.backgroundColor = answers.bgcolor;
            fs.writeFileSync(pp, JSON.stringify(p, null, 2));
            require("./lib/setPListColor")();
            console.log("Updated background color", answers.bgcolor);
          });
      },
    },
  ],
};
