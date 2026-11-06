import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {renderHomeMaterials} from "./home-materials.mjs";
import {buildRadarCSS} from './radar-css.mjs';
import {buildSEO} from './seo.mjs';

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(root, ".dist");
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== ".dist") {
  throw new Error("Output must stay inside the website directory");
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
const publicFiles = [
  ".nojekyll", "index.html", "privacy.html", "support.html", "resources.html", "radar.html",
  "radar-assets/app.js", "radar-assets/i18n.js", "radar-assets/calendar.js", "radar-assets/library.js", "radar-assets/icon.png",
  "styles.css", "landing.css", "resources.css", "site.js", "support.js", "resources.js", "resources-core.mjs", "resources-data.json", "photo-composer.js", "composer-core.mjs",
  "app-icon.png", "oshipocket-icon.webp", "oshilove-home.webp", "oshilove-profile.webp", "oshipocket-stats.webp", "social-preview.png",
  "robots.txt", "sitemap.xml", "fonts", "material-previews", "oshi-deco"
];
function copyPublicFile(source, destination) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error("Public assets must not contain symbolic links");
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, {recursive: true});
    for (const file of fs.readdirSync(source)) copyPublicFile(path.join(source, file), path.join(destination, file));
  } else {
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
  }
}
for (const file of publicFiles) copyPublicFile(path.join(root, file), path.join(output, file));
const catalog = JSON.parse(fs.readFileSync(path.join(root,"resources-data.json"),"utf8"));
const homepage = path.join(output,"index.html");
const html = fs.readFileSync(homepage,"utf8").replace("<!-- home-material-previews -->",renderHomeMaterials(catalog));
fs.writeFileSync(homepage,html);
buildRadarCSS(root, path.join(output,'radar-assets/radar.css'));
buildSEO(root,output,catalog);
console.log("Built public website in .dist; Worker source and local originals are excluded.");
