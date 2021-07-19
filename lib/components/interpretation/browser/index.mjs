const global_document = document;

export default (dependencies) => {
  return {
    runScript: (script) => {
      const element = global_document.createElement("script");
      element.type = "text/javascript";
      element.text = script;
      global_document.body.appendChild(element);
    },
  };
};
