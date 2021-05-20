import { rollup } from 'rollup';
import CommonjsRollupPlugin from '@rollup/plugin-commonjs';

rollup({
  input: 'lib/server/inline.mjs',
  plugins: [CommonjsRollupPlugin()],
}).then((bundle) => {
  bundle
    .write({
      file: 'dist/inline.js',
      format: 'cjs',
    })
    .then(() => {
      bundle.close();
    });
});
