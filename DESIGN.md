# Eakraj Mobile Shop — design system

Design reference: [NextLevelBuilder UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Applied the installed `ui-ux-pro-max-nextlevelbuilder` skill, its relevant search results, accessibility priorities, and web layout guidance. Direct GitHub CLI/Git cloning was attempted but failed because GitHub DNS was unavailable in the terminal.

## Direction

A modern, approachable technology store: deep navy, electric lime accents, cool neutral surfaces, real product imagery, and bold geometric typography. This palette is a custom design decision; the automatic industry palette matches were not a suitable fit. No invented testimonials, stock claims, ratings, certifications, or confirmed promotions.

- Main ink/navy: `#142132`; white surfaces: `#ffffff`; page background: `#f4f6f8`.
- Lime accent: `#c6ee70` with navy text; muted text: `#526176`; border: `#dce2e8`.
- Font: Outfit with system sans-serif fallbacks. Body 16px; content line-height 1.6–1.8.
- Layout: max-width 1320px; consistent 4/8px spacing rhythm; 12–24px card radii.
- Mobile: 44px controls, collapsible navigation/filter controls, two-column product cards, no page-wide overflow.
- Focus: visible navy outline; reduced-motion support; native labelled controls and disclosure menus.

## Page system

The homepage uses a product-led bento hero, seven departments, featured phones, clearly labelled proposed laptop offers, setup collections, and local contact guidance. Catalogs use a desktop filter sidebar and a compact mobile filter toggle. Product pages use an image panel, prominent price/enquiry panel, specifications, and related products. Guides, reviews, comparison, and contact pages share the same typography, chrome, surfaces, and controls.

Run `node redesign.cjs` after generating the catalog. The existing product data, NRs. reference pricing, proposed 10% laptop offers, WhatsApp enquiries, URL filters, pagination, and comparison logic are preserved.
