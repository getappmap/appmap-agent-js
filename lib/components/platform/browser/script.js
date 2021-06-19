
const global_document = document;

const runScript = (script) => {
  const element = document.createElement("script");
  element.type = "text/javascript";
  element.text = script;
  document.body.appandChild(element);
};

module.exports = () => {
  runScript
};
