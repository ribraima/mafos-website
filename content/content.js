/*
 * MAFOS DESIGN — SITE CONTENT
 * ---------------------------------------------------------------------------
 * Everything the website shows lives in this one file: contact details,
 * categories, projects, packages and every sentence in both languages.
 * You never need to touch the HTML, CSS or JavaScript to add work.
 *
 * ADD A PROJECT
 *   1. Put the images in  images/projects/<project-slug>/
 *      (JPG or WebP, about 1600 px on the long side, under ~400 KB each).
 *   2. Copy one block from "projects" below, paste it at the TOP of the list
 *      (newest first), and change the values.
 *   3. "category" must match a "slug" from "categories".
 *   4. Delete "sample": true — that flag marks placeholder work.
 *
 * ADD A CATEGORY
 *   Add a line to "categories". A category appears on the site as soon as
 *   at least one project uses it.
 *
 * TEXT IN TWO LANGUAGES
 *   Any text can be a plain string ("Kafe Blloku") or a pair
 *   { "sq": "...", "en": "..." }. English is the default; Albanian is second.
 *   The order of "languages" below is the order of the switch in the header.
 *
 * Keep the format strict (double quotes, a comma between items, no comma
 * after the last item). One typo here stops the work grid from loading;
 * the browser console (F12) will say which line.
 * ---------------------------------------------------------------------------
 */
window.SITE_CONTENT = {
  "site": {
    "name": "Mafos",
    "descriptor": "Design",
    "defaultLang": "en",
    "languages": ["en", "sq"],
    "contact": {
      "whatsapp": "355690000000",
      "email": "hello@mafos.al",
      "phone": "+355 69 000 0000",
      "instagram": "mafos.design"
    }
  },

  "categories": [
    {
      "slug": "logos",
      "label": { "sq": "Logo & Identitet", "en": "Logos & Identity" },
      "description": { "sq": "Logo, ngjyra, fonte dhe gjithçka që e bën markën të njohur.", "en": "Logos, colours, type and everything that makes a brand recognisable." }
    },
    {
      "slug": "photos",
      "label": { "sq": "Fotografi", "en": "Photography" },
      "description": { "sq": "Fotografi për ushqim, produkte, hapësira dhe apartamente me qira.", "en": "Photography for food, products, spaces and rentals." }
    },
    {
      "slug": "portraits",
      "label": { "sq": "Portrete", "en": "Portraits" },
      "description": { "sq": "Portrete personale dhe profesionale, në studio ose në qytet.", "en": "Personal and professional portraits, in studio or on location." }
    },
    {
      "slug": "interior",
      "label": { "sq": "Interier", "en": "Interiors" },
      "description": { "sq": "Plane, renderime 3D dhe rifreskime për shtëpi dhe lokale.", "en": "Layouts, 3D renders and refreshes for homes and venues." }
    }
  ],

  "projects": [
    {
      "slug": "identitet-kafene",
      "category": "logos",
      "title": { "sq": "Identitet vizual për një kafene", "en": "Visual identity for a café" },
      "summary": { "sq": "Logo, ngjyra, menu dhe gota me markë për një kafene të re në Bllok.", "en": "Logo, colours, menu and branded cups for a new café in Blloku." },
      "year": 2026,
      "cover": "images/placeholders/logo-1.svg",
      "images": ["images/placeholders/logo-1.svg", "images/placeholders/logo-2.svg"],
      "sample": true
    },
    {
      "slug": "apartament-tirane",
      "category": "interior",
      "title": { "sq": "Interier për një apartament 2+1 në Tiranë", "en": "Interior for a two-bedroom apartment in Tirana" },
      "summary": { "sq": "Plan, renderime 3D dhe listë materialesh për një familje që jeton jashtë vendit.", "en": "Layout, 3D renders and a materials list for a family living abroad." },
      "year": 2026,
      "cover": "images/placeholders/interior-1.svg",
      "images": ["images/placeholders/interior-1.svg", "images/placeholders/interior-2.svg"],
      "sample": true
    },
    {
      "slug": "apartament-ne-plazh",
      "category": "photos",
      "title": { "sq": "Foto për një apartament me qira pranë detit", "en": "Photos for a seaside rental" },
      "summary": { "sq": "Foto për Airbnb dhe Booking, të menduara që apartamenti të dallohet mes dhjetëra të ngjashmëve.", "en": "Airbnb and Booking photos designed to make the apartment stand out among dozens of look-alikes." },
      "year": 2026,
      "cover": "images/placeholders/photo-2.svg",
      "images": ["images/placeholders/photo-2.svg", "images/placeholders/photo-1.svg"],
      "sample": true
    },
    {
      "slug": "portrete-ekipi",
      "category": "portraits",
      "title": { "sq": "Portrete profesionale për një ekip", "en": "Professional team portraits" },
      "summary": { "sq": "Seancë fotografike në zyrë për 12 anëtarë të ekipit, me dritë natyrale dhe sfond të njëjtë për faqen dhe LinkedIn.", "en": "An on-site session for a 12-person team, with natural light and one backdrop for the website and LinkedIn." },
      "year": 2026,
      "cover": "images/placeholders/portrait-1.svg",
      "images": ["images/placeholders/portrait-1.svg", "images/placeholders/portrait-2.svg"],
      "sample": true
    },
    {
      "slug": "logo-pasticeri",
      "category": "logos",
      "title": { "sq": "Logo për një pastiçeri familjare", "en": "Logo for a family bakery" },
      "summary": { "sq": "Rifreskim i një marke 20-vjeçare pa humbur ndjesinë e shtëpisë.", "en": "Refreshing a 20-year-old brand without losing its homely feel." },
      "year": 2026,
      "cover": "images/placeholders/logo-2.svg",
      "images": ["images/placeholders/logo-2.svg", "images/placeholders/logo-1.svg"],
      "sample": true
    },
    {
      "slug": "kafene-interier",
      "category": "interior",
      "title": { "sq": "Rifreskim interieri për një kafene", "en": "Interior refresh for a café" },
      "summary": { "sq": "Ndriçim, ngjyra dhe vende uljeje të reja me buxhet të kufizuar, para sezonit.", "en": "New lighting, colours and seating on a tight budget, before the season." },
      "year": 2026,
      "cover": "images/placeholders/interior-2.svg",
      "images": ["images/placeholders/interior-2.svg", "images/placeholders/interior-1.svg"],
      "sample": true
    },
    {
      "slug": "bujtine-theth",
      "category": "photos",
      "title": { "sq": "Fotografi për një bujtinë në Theth", "en": "Photography for a guesthouse in Theth" },
      "summary": { "sq": "Foto të peizazhit dhe dhomave për faqen dhe rrjetet sociale të bujtinës.", "en": "Landscape and room photos for the guesthouse's website and social media." },
      "year": 2026,
      "cover": "images/placeholders/photo-1.svg",
      "images": ["images/placeholders/photo-1.svg", "images/placeholders/photo-2.svg"],
      "sample": true
    },
    {
      "slug": "portret-ne-qytet",
      "category": "portraits",
      "title": { "sq": "Portret në qytet", "en": "City portrait session" },
      "summary": { "sq": "Seancë portreti në rrugët e Tiranës, në orën e artë.", "en": "A portrait session in the streets of Tirana at golden hour." },
      "year": 2026,
      "cover": "images/placeholders/portrait-2.svg",
      "images": ["images/placeholders/portrait-2.svg", "images/placeholders/portrait-1.svg"],
      "sample": true
    }
  ],

  "packages": [
    {
      "name": { "sq": "Hap Biznesin", "en": "Open for Business" },
      "for": { "sq": "Për biznese të reja ose që rinovojnë imazhin", "en": "For new businesses or a rebrand" },
      "includes": {
        "sq": ["Logo, ngjyra dhe fonte", "20 foto profesionale", "Instagram dhe Google Maps gati"],
        "en": ["Logo, colours and fonts", "20 professional photos", "Instagram and Google Maps set up"]
      },
      "price": { "sq": "nga €450", "en": "from €450" }
    },
    {
      "name": { "sq": "Paketa Mujore", "en": "Monthly Package" },
      "for": { "sq": "Për kafene, dyqane dhe salone", "en": "For cafés, shops and salons" },
      "includes": {
        "sq": ["Një seancë fotografike në muaj", "12 postime të dizajnuara", "Stories çdo javë"],
        "en": ["One photo shoot a month", "12 designed posts", "Stories every week"]
      },
      "price": { "sq": "nga €250 / muaj", "en": "from €250 / month" },
      "highlight": true
    },
    {
      "name": { "sq": "Gati për Airbnb", "en": "Airbnb Ready" },
      "for": { "sq": "Për pronarë dhe menaxherë apartamentesh me qira", "en": "For hosts and rental managers" },
      "includes": {
        "sq": ["Plan stilimi me listë blerjesh", "25 foto të përpunuara për njoftimin"],
        "en": ["Styling plan with a shopping list", "25 edited listing photos"]
      },
      "price": { "sq": "nga €250 / apartament", "en": "from €250 / unit" }
    },
    {
      "name": { "sq": "Projekt Interieri", "en": "Interior Project" },
      "for": { "sq": "Për apartamente dhe lokale të vogla", "en": "For apartments and small venues" },
      "includes": {
        "sq": ["Plan i hapësirës", "Renderime 3D", "Listë materialesh"],
        "en": ["Space layout", "3D renders", "Materials list"]
      },
      "price": { "sq": "nga €10 / m²", "en": "from €10 / m²" }
    }
  ],

  "text": {
    "sq": {
      "meta.homeTitle": "Studio dizajni në Tiranë",
      "a11y.skip": "Kalo te punët",
      "nav.work": "Punët",
      "nav.packages": "Paketat",
      "nav.about": "Rreth nesh",
      "nav.contact": "Kontakt",
      "nav.menu": "Menuja",
      "hero.eyebrow": "Studio dizajni · Tiranë",
      "hero.title": "Dizajn që e bën biznesin tënd të duket aq mirë sa është.",
      "hero.text": "Logo, fotografi, portrete dhe interier për biznese dhe njerëz në Shqipëri.",
      "hero.ctaPrimary": "Na shkruaj në WhatsApp",
      "hero.ctaSecondary": "Shiko punët",
      "work.title": "Punët tona",
      "work.filterLabel": "Filtro sipas kategorisë",
      "work.all": "Të gjitha",
      "work.empty": "Së shpejti — po përgatisim projekte të reja.",
      "work.sample": "Shembull",
      "packages.title": "Paketat",
      "packages.text": "Çmime të qarta që në fillim. Çdo paketë përshtatet me nevojat e tua.",
      "packages.highlight": "Rekomandohet",
      "packages.cta": "Pyet për këtë paketë",
      "about.title": "Rreth nesh",
      "about.text": "Mafos është një studio e re dizajni nga Shqipëria. Bëjmë logo dhe identitete vizuale, fotografi, portrete dhe projekte interieri — gjithçka që i duhet një biznesi për t'u dukur aq mirë sa është. Punojmë shpejt, me çmime të qarta dhe me marrëveshje me shkrim për çdo punë.",
      "contact.title": "Ke një projekt në mendje?",
      "contact.text": "Na trego për të. Zakonisht përgjigjemi brenda ditës.",
      "contact.city": "Tiranë, Shqipëri",
      "project.back": "Të gjitha punët",
      "project.client": "Klienti",
      "project.year": "Viti",
      "project.next": "Projekti tjetër",
      "project.ctaTitle": "Dëshiron diçka të ngjashme?",
      "project.ctaButton": "Na shkruaj për këtë",
      "project.sampleNote": "Projekt shembull — së shpejti me punë reale.",
      "project.notFound": "Ky projekt nuk u gjet.",
      "footer.rights": "Të gjitha të drejtat e rezervuara.",
      "whatsapp.general": "Përshëndetje {brand}! Kam një projekt dhe do të doja të flisnim.",
      "whatsapp.project": "Përshëndetje! Pashë projektin \"{title}\" në faqen tuaj dhe do të doja diçka të ngjashme.",
      "whatsapp.package": "Përshëndetje! Më intereson paketa \"{name}\". Mund të më tregoni më shumë?"
    },
    "en": {
      "meta.homeTitle": "Design studio in Tirana",
      "a11y.skip": "Skip to work",
      "nav.work": "Work",
      "nav.packages": "Packages",
      "nav.about": "About",
      "nav.contact": "Contact",
      "nav.menu": "Menu",
      "hero.eyebrow": "Design studio · Tirana",
      "hero.title": "Design that makes your business look as good as it is.",
      "hero.text": "Logos, photography, portraits and interiors for businesses and people in Albania.",
      "hero.ctaPrimary": "Message us on WhatsApp",
      "hero.ctaSecondary": "See our work",
      "work.title": "Our work",
      "work.filterLabel": "Filter by category",
      "work.all": "All",
      "work.empty": "Coming soon — new projects are on their way.",
      "work.sample": "Sample",
      "packages.title": "Packages",
      "packages.text": "Clear prices from the start. Every package adapts to what you need.",
      "packages.highlight": "Recommended",
      "packages.cta": "Ask about this package",
      "about.title": "About us",
      "about.text": "Mafos is a young design studio from Albania. We make logos and visual identities, photography, portraits and interior projects — everything a business needs to look as good as it is. We work fast, with clear prices and a written agreement for every job.",
      "contact.title": "Got a project in mind?",
      "contact.text": "Tell us about it. We usually reply within the day.",
      "contact.city": "Tirana, Albania",
      "project.back": "All work",
      "project.client": "Client",
      "project.year": "Year",
      "project.next": "Next project",
      "project.ctaTitle": "Want something similar?",
      "project.ctaButton": "Ask us about this",
      "project.sampleNote": "Sample project — real work coming soon.",
      "project.notFound": "This project could not be found.",
      "footer.rights": "All rights reserved.",
      "whatsapp.general": "Hi {brand}! I have a project and would love to talk.",
      "whatsapp.project": "Hi! I saw the \"{title}\" project on your website and I'd like something similar.",
      "whatsapp.package": "Hi! I'm interested in the \"{name}\" package. Could you tell me more?"
    }
  }
};
