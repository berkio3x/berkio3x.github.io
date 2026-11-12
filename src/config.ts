// Everything personal lives here. Edit this file to make the site yours.
// Placeholder values are marked with TODO.

export const SITE = {
  name: 'anekix',
  // TODO: your real name, shown on the About page.
  fullName: 'Kshitij',
  // One line under the name on the home page.
  tagline: 'Software engineer. I build systems, tools and the occasional strange idea.',
  // Used in <meta name="description"> and the RSS feed.
  description: 'Portfolio and notes of Kshitij (anekix): projects, writing and experiments.',
  // TODO: your city and IANA time zone, used for the live clock in the footer.
  location: 'Bengaluru',
  timeZone: 'Asia/Kolkata',
  // TODO: your coordinates. The sky on the site shows the real sun and moon
  // over this point, right now. Two decimals is enough (about 1 km).
  coords: { lat: 12.97, lon: 77.59 },
  email: 'hello@example.com',
  // Short status lines that cycle on the home page.
  now: [
    'building small, sharp tools',
    'writing about what I learn',
    'open to interesting problems',
  ],
};

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/anekix' },
  // TODO: replace or remove.
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Email', href: 'mailto:hello@example.com' },
];

export const NAV = [
  { label: 'About', href: 'about/' },
  { label: 'Work', href: 'work/' },
  { label: 'Posts', href: 'posts/' },
];

// TODO: replace with your projects. `year` is free text.
export const PROJECTS = [
  {
    name: 'Project One',
    year: '2026',
    role: 'Author',
    summary: 'A short sentence on what it does and why it exists.',
    tags: ['TypeScript', 'CLI'],
    href: 'https://github.com/anekix',
  },
  {
    name: 'Project Two',
    year: '2025',
    role: 'Maintainer',
    summary: 'A data pipeline that turns messy inputs into something useful.',
    tags: ['Python', 'Data'],
    href: 'https://github.com/anekix',
  },
  {
    name: 'Project Three',
    year: '2024',
    role: 'Co-author',
    summary: 'A web app with a backend that stays boring on purpose.',
    tags: ['Go', 'Postgres'],
    href: 'https://github.com/anekix',
  },
];

// TODO: replace with your experience. Newest first.
export const EXPERIENCE = [
  { when: '2024 to now', what: 'Senior Engineer', where: 'Company A' },
  { when: '2021 to 2024', what: 'Software Engineer', where: 'Company B' },
  { when: '2019 to 2021', what: 'Developer', where: 'Company C' },
];

export const STACK = [
  { group: 'Languages', items: 'TypeScript, Python, Go, SQL' },
  { group: 'Systems', items: 'Linux, Docker, Kubernetes, Postgres' },
  { group: 'Craft', items: 'APIs, data pipelines, developer tools' },
];
