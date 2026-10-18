import {products as defaults} from './products.js';

export function validProduct(p) {
  return typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 120
    && ['Men', 'Women'].includes(p.category) && Number.isFinite(p.price) && p.price > 0 && p.price <= 1000000
    && typeof p.image === 'string' && p.image.length <= 2048
    && /^(https:\/\/[^\s]+|assets\/[a-zA-Z0-9_.-]+)$/.test(p.image);
}

export function mergeCatalog(records) {
  const catalog = new Map(defaults.map(p => [p.id, {...p}]));
  for (const p of records) if (validProduct(p)) catalog.set(p.id, p);
  return [...catalog.values()];
}
