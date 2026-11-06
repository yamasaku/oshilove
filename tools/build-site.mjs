import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {renderHomeMaterials} from "./home-materials.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(root, ".dist");
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== ".dist") {
  throw new Error("Output must stay inside the website directory");
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
const publicFiles = [
  ".nojekyll", "index.html", "ja.html", "zh-tw.html", "en.html", "privacy.html", "support.html", "resources.html",
  "styles.css", "landing.css", "resources.css", "site.js", "support.js", "resources.js", "resources-core.mjs", "resources-data.json",
  "app-icon.png", "oshipocket-icon.webp", "oshilove-home.webp", "oshilove-profile.webp", "oshipocket-stats.webp", "social-preview.png",
  "robots.txt", "sitemap.xml", "fonts", "material-previews", "oshi-deco"
];
function copyPublicFile(source, destination) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error("Public assets must not contain symbolic links");
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, {recursive: true});
    for (const file of fs.readdirSync(source)) copyPublicFile(path.join(source, file), path.join(destination, file));
  } else fs.copyFileSync(source, destination);
}
for (const file of publicFiles) copyPublicFile(path.join(root, file), path.join(output, file));
const catalog = JSON.parse(fs.readFileSync(path.join(root,"resources-data.json"),"utf8"));
for (const page of ["index.html","ja.html","zh-tw.html","en.html"]) {
  const file = path.join(output,page);
  const html = fs.readFileSync(file,"utf8").replace("<!-- home-material-previews -->",renderHomeMaterials(catalog));
  fs.writeFileSync(file,html);
}
console.log("Built public website in .dist; Worker source and local originals are excluded.");
