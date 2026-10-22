# Mafos Design — portfolio website

Double-click `index.html` to open the site. Nothing to install, no build step, no server.

Brand rules (logo, colours, fonts, components) live in the Mafos Design brandbook: https://claude.ai/artifact/Qk8rk1i7ShiaxU5a6TRHEf. The colour and spacing tokens at the top of `assets/css/style.css` use the same names and values.

## How it is built, and why

- **Plain HTML, CSS and one JavaScript file.** Free to host anywhere, nothing to update, nothing to break.
- **All content lives in `content/content.js`**: projects, categories, packages, contact details and every sentence in Albanian and English. Adding work never means touching the HTML, CSS or JavaScript.
- **One seam for growth.** `loadContent()` in `assets/js/app.js` is the only code that knows where content comes from. Moving to a JSON file or a CMS later changes that function and nothing else.
- **English first, Albanian one click away.** The visitor's choice is remembered. `?lang=sq` in a link opens the Albanian version. The default and the order of the switch are `site.defaultLang` and `site.languages` in `content/content.js`.
- **Shareable category links.** `index.html?c=logos` opens the site filtered to logos, ready to send in a WhatsApp chat.
- **WhatsApp everywhere.** Every package and project has a button that opens WhatsApp with a pre-written message naming that package or project.

```
index.html              Home: hero, work grid with category filters, packages, about, contact
project.html            One project: project.html?p=<project-slug>
content/content.js      ALL content: edit this file
assets/css/style.css    Styles; brand colours and fonts are tokens at the top
assets/js/app.js        Rendering, language switch, filters
assets/img/favicon.svg  Browser tab icon
images/placeholders/    Sample artwork; delete once real work is in
images/projects/        Put real project images here, one folder per project
add-project.cmd         Drag a folder of project files onto it to add a project
publish.cmd             Double-click to publish your changes
scripts/add-project.ps1 What add-project.cmd runs (web copies + content entry)
scripts/check-content.js  Checks content before every deploy
.github/workflows/      The publishing pipeline (GitHub Actions)
```

## Add a project (any file size)

1. Put the project's files in one folder anywhere on your computer: JPG, PNG, TIFF, PSD, HEIC, WebP or PDF, at any size. Name them in the order they should appear (`01`, `02`, …). A file named `cover` becomes the cover; otherwise the first file does.
2. Drag the folder onto **`add-project.cmd`**.
3. Answer the questions: title in English and Albanian, category, year, an optional client name, a one-sentence description, and an optional YouTube or Vimeo link.
4. A preview opens in your browser. If it looks right, double-click `publish.cmd`.

What happens to the files:

- **Originals stay on your computer** and are never uploaded. Keep them backed up (Google Drive, an external disk).
- Every image, and every page of every PDF, becomes web copies 800, 1600 and 2400 px wide in WebP: usually 100–600 KB each instead of tens of MB. Colours are converted for screens (CMYK print files too), photos are turned upright, and hidden data such as camera details and GPS location is removed.
- Each visitor's browser downloads only the size its screen needs. Click any image on a project page to see it full screen; use the arrow keys or buttons to move through the project.
- **Videos** are never uploaded to the site. Put them on YouTube (Unlisted is fine) or Vimeo and give `add-project.cmd` the link; it plays on the project page.
- Larger work (a 60-page brand book, a full photo shoot) is fine: every page or photo becomes its own image. For a downloadable original, share a Google Drive link in the description instead.

`add-project.cmd` needs ImageMagick and Poppler, which are installed on this computer. On another Windows computer, run once: `winget install ImageMagick.ImageMagick oschwartz10612.Poppler`.

### By hand

For images that are already small:

1. Create `images/projects/<project-slug>/` and put the images in it.
2. In `content/content.js`, copy one block from `"projects"`, paste it at the top of the list (newest first), and edit it:

```js
{
  "slug": "hotel-durres-identity",
  "category": "logos",
  "title": { "sq": "Identitet për një hotel në Durrës", "en": "Identity for a hotel in Durrës" },
  "summary": { "sq": "Logo, tabela dhe uniforma për stafin.", "en": "Logo, signage and staff uniforms." },
  "client": "Hotel Example",
  "year": 2026,
  "cover": "images/projects/hotel-durres-identity/cover.jpg",
  "images": [
    "images/projects/hotel-durres-identity/01.jpg",
    "images/projects/hotel-durres-identity/02.jpg"
  ]
},
```

- `slug`: lowercase letters, numbers and dashes, unique. It becomes the project's link.
- `category`: must match a `slug` in `"categories"`.
- `client` is optional. Leave it out if the client hasn't agreed to be named.
- Leave out `"sample": true`. That flag marks placeholder work and shows a "Shembull / Sample" badge.

If something doesn't show up, open the browser console (F12). The site prints a warning for unknown categories, duplicate slugs and missing covers.

## Add a category

Add a block to `"categories"` with a `slug`, a `label` and a `description`. A category appears in the filters as soon as one project uses it.

## Images

- Use `add-project.cmd` and file size stops mattering. Added by hand, keep images to JPG or WebP, about 1600 px on the long side and under ~400 KB.
- Grid covers are cropped to 4:5 (portrait), so keep the subject near the centre.
- The host refuses any file over 25 MB, and the publishing check stops a deploy with a clear message if one slips in. Anything over 2 MB gets a warning.

## Before launch

- [ ] Confirm the name. The logo says **MAFOS**; change `site.name` if that is wrong.
- [ ] Real WhatsApp number (country code, no `+` or spaces), email and Instagram in `site.contact`.
- [ ] Replace the 8 sample projects with real work and delete `images/placeholders/`.
- [ ] Check the package prices in `"packages"`. Delete the whole list to hide the section.
- [ ] Check the city ("Tiranë / Tirana") in `text`.
- [ ] Optional: the header wordmark is typeset in Archivo Expanded to match the logo. To use the real logo file, export it as SVG into `assets/img/` and swap the `.brand` contents in both HTML files for an `<img>`.

## Publishing (automatic, free)

The site is live at **https://mafos.pages.dev** (Cloudflare Pages), with a backup copy at https://ribraima.github.io/mafos-website/ (GitHub Pages). Both are free. Every change that reaches the `main` branch on GitHub goes live on both by itself in about a minute:

```
edit files ──► publish.cmd ──► GitHub ──► check content ──► deploy ──► live site
                (or edit on github.com)        │
                                               └─ problem found? deploy stops, live site unchanged
```

- **From this computer:** make your changes, then double-click `publish.cmd`. It asks what you changed, saves a version and sends it to GitHub.
- **From anywhere:** open the repository on github.com, edit `content/content.js` or upload images in the browser, and commit. That publishes too. (Run `publish.cmd` once afterwards on this computer, or before your next local edit, so both copies stay in step. It pulls the web edits down first.)
- **Safety net:** before every deploy, `scripts/check-content.js` looks for typos in `content.js`, images that don't exist (file names are case-sensitive online) and duplicate slugs. If it finds a problem, the deploy stops, the live site stays as it was, and the reason is shown in the repository's **Actions** tab.
- **Every version is kept.** Any earlier state of the site can be brought back from the history on GitHub.
- **Your own domain:** buy one (e.g. mafos.al), then in Cloudflare open **Workers & Pages → mafos → Custom domains** and add it. HTTPS is free.
- **Cloudflare access:** the pipeline uses an API token named "Mafos website deploy" (Cloudflare Pages → Edit only), stored as the encrypted GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. To revoke it, delete it at dash.cloudflare.com/profile/api-tokens.

The pipeline is `.github/workflows/deploy.yml`. Only the site files (`index.html`, `project.html`, `assets/`, `content/`, `images/`) are published; this README, the scripts and the logo PDF are not.

## When to scale, and how

Don't do any of this until the trigger happens.

| When this happens | Do this | What changes |
| --- | --- | --- |
| Non-technical teammates need to add projects | Move content into `content.json` and add [Decap CMS](https://decapcms.org) (free, gives an admin page at `/admin`) | `loadContent()` fetches the JSON; nothing else |
| You want each project to rank on Google | Pre-render the pages from the same content with Astro or Eleventy | Same content and CSS; pages become static HTML |
| You want a contact form | Netlify Forms or Formspree | One `<form>` in `index.html` |
| The repository passes ~1 GB of images (roughly 500+ projects) | Move `images/projects/` to Cloudflare R2 (10 GB free) and have `add-project.ps1` upload there | Image paths only |
| A third language (e.g. Italian for diaspora clients) | Add `"it"` to `site.languages`, an `"it"` block in `text`, and `"it"` keys on project fields | Content only |
