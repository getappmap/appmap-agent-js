
import {URL} from "url";

const dirname = Path.dirname(new Url.URL(import.meta.url).pathname);

exports const bundle (namespace, ecma, platform, channel) => {
  if (ecma >= 2015) {
    ecma = 2015;
  }
  const basename = Path.join(__dirname, "..", "src", `ecma${ecma}`);
  let bundle = "";
  [
    Path.join(platform, "send", `${channel}.js`),
    Path.join(platform, "engine.js"),
    "empty-symbol.js",
    "event-counter.js",
    "identity.js",
    "now.js",
    "serialize.js"
  ].forEach((relative) => {
    bundle += Fs.readFileSync(Path.join(basename, relative), "utf8");
  }).replace(/APPMAP_[A-Z_]*/g);
};
