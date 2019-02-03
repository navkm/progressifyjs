import { log_sw } from "./utils.js";
import { Router } from "./router.js";
import { Config } from "./config.js";

const DB_NAME = "progressify";
const CONFIG_OBJECT_STORE = "config";

var router;
const moduleExports = {};

/**
 * @description 
 * <font color='#0b18ba'>progressifyjs.sw</font> is the library that is used by the service worker
 *
 * 
 * @namespace  sw
 * @memberof progressify
 *
 */
moduleExports.sw = {};

/**
 * @description 
 * Initializes the service worker library
 *
 * 
 * @method init
 * @returns void
 * @memberof progressify.sw
 *
 */

moduleExports.sw.init = () => {
  log_sw("Service Worker init called. Add a listener to the install event");
  self.addEventListener("install", function(event) {
    log_sw("Service Worker install called");
    var promise = new Promise(function(resolve, reject) {
      const idbOpenRequest = indexedDB.open(DB_NAME);
      idbOpenRequest.onsuccess = function(event) {
        log_sw("Successfully opened IDB named:" + DB_NAME);
        const idbDatabase = event.target.result; //IDBDatabase
        const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], "readonly");
        const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
        log_sw(
          "Retrieving config object from the Object Store named:" +
            CONFIG_OBJECT_STORE
        );
        let request = objectStore.get(1);
        request.onsuccess = function(e) {
          log_sw("Config object successfully retrieved. Create a new router");
          const configObject = e.target.result;
          router = new Router(Config.fromObject(configObject));
        };
        resolve(idbOpenRequest.result);
      };
      idbOpenRequest.onerror = () => reject(idbOpenRequest.error);
    });
    event.waitUntil(promise);
  });
  log_sw("Service Worker init called. Add a listener to the activate event");
  self.addEventListener("activate", function(event) {
    log_sw("Service worker is activated");
    return self.clients.claim();
  });
  log_sw("Service Worker init called. Add a listener to the fetch event");
  self.addEventListener("fetch", handleFetch);
};

function handleFetch(event) {
  router.route(event);
}

/*
 * Export the public API
 */

export default moduleExports;
