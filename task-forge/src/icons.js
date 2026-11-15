const paths = {
 layout:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
 inbox:'<path d="M4 4h16l2 11v5H2v-5L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',
 settings:'<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
 upload:'<path d="M12 16V3m0 0-4 4m4-4 4 4M4 16v4h16v-4"/>',
 download:'<path d="M12 3v13m0 0-4-4m4 4 4-4M4 17v4h16v-4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 arrow:'<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 flag:'<path d="M5 21V4m0 0c6-4 8 4 15 0v12c-7 4-9-4-15 0"/>',
 house:'<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
 bike:'<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="m5.5 17.5 5-10 3 10h5l-5-8h-7"/>',
 car:'<path d="m5 16-2 1v3h4v-2h10v2h4v-3l-2-1-2-8H7l-2 8Z"/><path d="M5 16h14M7 8l-2 8m12-8 2 8"/>',
 mountain:'<path d="m2 20 7-15 4 8 2-4 7 11H2Z"/>',
 wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 8V5a2 2 0 0 1 2-2h13M15 13h6v5h-6a2 2 0 0 1 0-5Z"/>',
 heart:'<path d="M20.5 7.5a5 5 0 0 0-8.5-3.5 5 5 0 0 0-8.5 3.5c0 7 8.5 12.5 8.5 12.5s8.5-5.5 8.5-12.5Z"/>',
 cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4M2 15h4m12-6h4m-4 6h4"/>',
 shopping:'<path d="M4 8h16l-1 13H5L4 8ZM9 8V6a3 3 0 0 1 6 0v2"/>',
 pencil:'<path d="M14 5l5 5M4 20l5-1 11-11-4-4L5 15l-1 5Z"/>',
 close:'<path d="M5 5l14 14M19 5 5 19"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
 filter:'<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 rotate:'<path d="M3 11a9 9 0 1 1 3 7M3 3v8h8"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};
export function icon(name, size=19) {
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.dots}</svg>`;
}
export function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon,el.dataset.size||19));}