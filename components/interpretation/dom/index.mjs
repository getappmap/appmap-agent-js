const global_document = document;

export default (_dependencies) => {
  return {
    runScript: (script, _url) => {
      const element = global_document.createElement("script");
      element.type = "text/javascript";
      element.text = script;
      // TODO find out how to attach url to script element
      // element.src = url;
      global_document.body.appendChild(element);
    },
  };
};
