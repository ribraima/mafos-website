/*
 * Runs before every deploy (see .github/workflows/deploy.yml).
 * Stops the deploy with a clear message if content/content.js has a typo,
 * a project points at a missing image, or two projects share a slug.
 * Run it yourself with:  node scripts/check-content.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const contentFile = path.join(root, "content", "content.js");
const inGitHubActions = process.env.GITHUB_ACTIONS === "true";
const errors = [];

function loadContent() {
  const sandbox = { window: {} };
  try {
    vm.runInNewContext(fs.readFileSync(contentFile, "utf8"), sandbox, { filename: "content/content.js" });
  } catch (error) {
    console.error("content/content.js could not be read. This is usually a missing comma, quote or bracket:\n");
    console.error(error.stack.split("\n").slice(0, 6).join("\n"));
    if (inGitHubActions) console.log(`::error title=Content check::content/content.js has a typo: ${error.message}`);
    process.exit(1);
  }
  return sandbox.window.SITE_CONTENT;
}

const content = loadContent();
if (!content) {
  console.error("content/content.js must set window.SITE_CONTENT.");
  process.exit(1);
}

const { site = {}, categories = [], projects = [], text = {} } = content;
const languages = site.languages || [];

if (!languages.includes(site.defaultLang)) {
  errors.push(`site.defaultLang "${site.defaultLang}" is not listed in site.languages.`);
}
languages.forEach((lang) => {
  if (!text[lang]) errors.push(`"text" has no "${lang}" block, but "${lang}" is listed in site.languages.`);
});

const categorySlugs = new Set();
categories.forEach((category, i) => {
  if (!category.slug) errors.push(`categories[${i}] has no slug.`);
  else if (categorySlugs.has(category.slug)) errors.push(`Two categories use the slug "${category.slug}".`);
  categorySlugs.add(category.slug);
});

// The live server is case-sensitive: "Cover.JPG" and "cover.jpg" are different files there.
const fileExists = (relativePath) => fs.existsSync(path.join(root, relativePath));

// Every file an image points at: a plain path, or the web copies in an image object's srcset.
function imageFiles(image) {
  if (!image || image.embed) return [];
  if (typeof image === "string") return [image];
  const files = new Set([image.src]);
  String(image.srcset || "")
    .split(",")
    .forEach((part) => files.add(part.trim().split(/\s+/)[0]));
  return [...files].filter(Boolean);
}

const VIDEO_LINK = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//;

const projectSlugs = new Set();
projects.forEach((project, i) => {
  const name = project.slug ? `Project "${project.slug}"` : `projects[${i}]`;

  if (!project.slug) errors.push(`${name} has no slug.`);
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.slug)) errors.push(`${name}: a slug may only use lowercase letters, numbers and dashes.`);
  else if (projectSlugs.has(project.slug)) errors.push(`Two projects use the slug "${project.slug}".`);
  projectSlugs.add(project.slug);

  if (!categorySlugs.has(project.category)) errors.push(`${name} uses category "${project.category}", which is not in "categories".`);
  if (!project.title) errors.push(`${name} has no title.`);
  if (!project.cover) errors.push(`${name} has no cover image.`);

  const media = [project.cover, ...(project.images || [])];
  media.forEach((item) => {
    if (item && item.embed && !VIDEO_LINK.test(item.embed)) {
      errors.push(`${name}: video link must be a YouTube or Vimeo address: ${item.embed}`);
    }
  });
  new Set(media.flatMap(imageFiles)).forEach((image) => {
    if (!fileExists(image)) errors.push(`${name}: image not found: ${image} (check the spelling and capital letters).`);
  });
});

// Cloudflare Pages refuses files over 25 MiB, and big files are slow on phones anyway.
const MAX_BYTES = 25 * 1024 * 1024;
const HEAVY_BYTES = 2 * 1024 * 1024;
const warnings = [];
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
const imagesDir = path.join(root, "images");
if (fs.existsSync(imagesDir)) {
  walk(imagesDir).forEach((file) => {
    const size = fs.statSync(file).size;
    const relative = path.relative(root, file).split(path.sep).join("/");
    const mb = (size / 1024 / 1024).toFixed(1);
    if (size > MAX_BYTES) errors.push(`${relative} is ${mb} MB; the host refuses files over 25 MB. Add the original with add-project.cmd, which makes small web copies.`);
    else if (size > HEAVY_BYTES) warnings.push(`${relative} is ${mb} MB, which loads slowly on phones. add-project.cmd makes web copies of a few hundred KB.`);
  });
}

warnings.forEach((warning) => {
  console.warn(`Warning: ${warning}`);
  if (inGitHubActions) console.log(`::warning title=Heavy image::${warning}`);
});

if (errors.length) {
  console.error(`Content check failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
  errors.forEach((error) => console.error(`  - ${error}`));
  console.error("\nFix these in content/content.js (or add the missing images) and publish again. The live site was not changed.");
  if (inGitHubActions) errors.forEach((error) => console.log(`::error title=Content check::${error}`));
  process.exit(1);
}

console.log(`Content OK: ${projects.length} projects in ${categorySlugs.size} categories, languages: ${languages.join(", ")}.`);
