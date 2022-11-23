const { document } = globalThis;

export const runScript = (script, _url) => {
  const element = document.createElement("script");
  element.type = "text/javascript";
  element.text = script;
  // TODO find out how to attach url to script element
  // element.src = url;
  document.body.appendChild(element);
};
