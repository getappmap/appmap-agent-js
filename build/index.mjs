import('./globals.mjs').then(() =>
  import('./schema.mjs').then(() => import('./inline.mjs')),
);
