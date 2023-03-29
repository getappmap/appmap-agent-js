import { exit, argv } from "node:process";
import { URL } from "node:url";
import { ResourceLoader, JSDOM } from "jsdom";

const {
  parseInt,
  String,
  Promise,
  setTimeout,
  Reflect: { defineProperty },
} = globalThis;

const { fromURL: loadDomAsync } = JSDOM;

const backend_port = parseInt(argv[2]);
const proxy_port = parseInt(argv[3]);

await loadDomAsync(`http://localhost:${String(backend_port)}/index.html`, {
  runScripts: "dangerously",
  resources: new ResourceLoader({
    proxy: `http://localhost:${String(proxy_port)}`,
  }),
  // Unfortunately, in jsdom, a proxy cannot be configured for WebSocket.
  beforeParse: (window) => {
    const { WebSocket: JsdomWebSocket } = window;
    defineProperty(window, "WebSocket", {
      __proto__: null,
      value: function WebSocket(url) {
        const url_obj = new URL(url);
        url_obj.port = String(proxy_port);
        return new JsdomWebSocket(url_obj.toString());
      },
      writable: true,
      enumerable: false,
      configurable: true,
    });
  },
});

// Wait for the websocket to flush its data
await new Promise((resolve) => {
  setTimeout(resolve, 3000);
});

// The websocket created in the prelude prevent exit
exit(0);
