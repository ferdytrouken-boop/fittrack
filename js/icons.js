// Iconos SVG en línea (sin dependencias). Usan currentColor.
const s = (body, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  // Actividades
  gym: s(`<rect x="1.5" y="9" width="3" height="6" rx="1"/><rect x="4.5" y="6.5" width="3.2" height="11" rx="1.2"/>
          <rect x="16.3" y="6.5" width="3.2" height="11" rx="1.2"/><rect x="19.5" y="9" width="3" height="6" rx="1"/>
          <path d="M7.7 12h8.6" stroke-width="2.6"/>`),
  running: s(`<circle cx="14.5" cy="4" r="2" fill="currentColor" stroke="none"/>
          <path d="M9.5 21l2.6-5.2 3 2.7V23"/><path d="M12.1 15.8l1.4-6.3"/>
          <path d="M6.5 11l2.8-2.4 4.2.9 2.3 3.2 3.2 1"/><path d="M13.5 9.5l-1.7 3.8-4.3 1.2"/>`),
  football: s(`<circle cx="12" cy="12" r="9.5"/>
          <path d="M12 7.3l3.3 2.4-1.3 3.9h-4l-1.3-3.9z" fill="currentColor"/>
          <path d="M12 7.3V2.6M15.3 9.7l4.3-1.6M14 13.6l2.7 3.8M10 13.6l-2.7 3.8M8.7 9.7L4.4 8.1"/>`),
  spinning: s(`<circle cx="5.5" cy="17" r="3.7"/><circle cx="18.5" cy="17" r="3.7"/>
          <path d="M5.5 17l4.5-7.5h6.5L18.5 17"/><path d="M10 9.5L12 17h1.5"/><path d="M8.5 6.5h3"/>
          <path d="M16.5 9.5l-.8-3.5h2.3"/>`),
  other: s(`<circle cx="12" cy="13.5" r="8"/><path d="M12 13.5V9.5M9.5 2.5h5M12 2.5v3"/><path d="M18.5 6.5l1.5-1.5"/>`),

  // Interfaz
  home: s(`<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>`),
  calendar: s(`<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>
          <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>`),
  history: s(`<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v4.5h4.5"/><path d="M12 7.5V12l3 2"/>`),
  stats: s(`<path d="M4 20V11M10 20V4M16 20v-7M22 20H2"/>`),
  plus: s(`<path d="M12 5v14M5 12h14"/>`),
  close: s(`<path d="M6 6l12 12M18 6L6 18"/>`),
  left: s(`<path d="M15 5l-7 7 7 7"/>`),
  right: s(`<path d="M9 5l7 7-7 7"/>`),
  check: s(`<path d="M4.5 12.5l5 5 10-11"/>`),
  settings: s(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
  clock: s(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`),
  flame: s(`<path d="M12 22c4 0 7-2.7 7-6.8 0-3.7-2.6-6-4.2-8.7-.4 2-1.4 3.2-2.6 3.8C12.5 7 11 4 8.5 2c.3 3.5-3.5 6.5-3.5 11.5C5 18.8 8 22 12 22z"/>`),
  route: s(`<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5"/>`),
  bolt: s(`<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`),
  trash: s(`<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>`),
  copy: s(`<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>`),
  cloud: s(`<path d="M7 18.5h10.5a4 4 0 0 0 .6-8A6 6 0 0 0 6.5 9a4.8 4.8 0 0 0 .5 9.5z"/>`),
  cloudOff: s(`<path d="M3 3l18 18"/><path d="M9.5 6.3A6 6 0 0 1 18.1 10.5a4 4 0 0 1 2 6.7M17.5 18.5H7A4.8 4.8 0 0 1 5.2 9.3"/>`),
  trophy: s(`<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H3.5a3.5 3.5 0 0 0 3.8 4.5M17 6h3.5a3.5 3.5 0 0 1-3.8 4.5"/><path d="M12 14v4M8 21h8M9.5 18h5"/>`),
  heart: s(`<path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.5 2.7c0 6-8.5 11-8.5 11z"/>`),
  muscle: s(`<path d="M4 17c0-5 2-9 5-12l2.5 1.5L10 9l2 1c2.5-1.5 6.5-1 8 2.5 1 3-1 6.5-5 7.5H7a3 3 0 0 1-3-3z"/>`),
};

export const icon = (name, cls = '') => `<span class="ic ${cls}">${ICONS[name] || ICONS.other}</span>`;
