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

  new Set([project.cover, ...(project.images || [])]).forEach((image) => {
    if (image && !fileExists(image)) errors.push(`${name}: image not found: ${image} (check the spelling and capital letters).`);
  });
});

if (errors.length) {
  console.error(`Content check failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
  errors.forEach((error) => console.error(`  - ${error}`));
  console.error("\nFix these in content/content.js (or add the missing images) and publish again. The live site was not changed.");
  if (inGitHubActions) errors.forEach((error) => console.log(`::error title=Content check::${error}`));
  process.exit(1);
}

console.log(`Content OK: ${projects.length} projects in ${categorySlugs.size} categories, languages: ${languages.join(", ")}.`);
