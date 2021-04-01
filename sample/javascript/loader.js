// export async function transformSource(source, context, defaultTransformSource) {
//   console.log(context);
//   return defaultTransformSource(source, context, defaultTransformSource);
// }

exports.transformSource = function (source, context, defaultTransformSource) {
  console.log(context);
  return new Promise((resolve, reject) => {
    resolve(defaultTransformSource(source, context, defaultTransformSource));
  });
};
