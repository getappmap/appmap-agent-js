import('./globals.mjs').then(() => {
  import('./inline.mjs');
  // import('./schema.mjs').then(() => import('./inline.mjs')),
});
