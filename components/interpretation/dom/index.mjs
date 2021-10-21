const global_document = document;

export default (dependencies) => {
  return {
    runScript: (script, url) => {
      const element = global_document.createElement("script");
      element.type = "text/javascript";
      element.text = script;
      // element.src = url;
      global_document.body.appendChild(element);
    },
  };
};
