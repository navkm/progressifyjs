/**
 * progressifyjs consists of two distinct components:<br/>
 * progressifyjs.pwa is the component that needs to be included in your HTML page<br/>
 * <b>progressifyjs.sw</b> is the service worker component
 * 
 * @namespace  progressify
 *
 */

import { log_pwa } from "./utils.js";
import { Config } from "./config.js";

const DB_NAME = "progressify";
const CONFIG_OBJECT_STORE = "config";

const moduleExports = {};

/**
 * progressifyjs.pwa is the page javascript
 *
 * 
 * @namespace  pwa
 * @memberof progressify
 *
 */


moduleExports.pwa = {};

function registerServiceWorker(swPath) {
  log_pwa("Register SW for path: " + swPath);
  navigator.serviceWorker.register(swPath).then(function() {
    log_pwa("SW successfully registered !");
  });
}

/**
 * 
 * TBD: Describe the init method 
 *
 * 
 * @method init
 * @memberof progressify.pwa
 *
 */
moduleExports.pwa.init = (swPath = "/sw.js", config = null) => {
  log_pwa("Verifying if progressify is supported on this browser ..");
  // check for support for IndexedDB and serviceworker
  if (window.indexedDB && navigator.serviceWorker) {
    log_pwa("IndexedDB and ServiceWorkers are supported on this browser");
    log_pwa(
      "Initializing Progressive Web App. Service Worker registered from path: " +
        swPath
    );
    initAndCreateConfig(swPath, config);
  } else {
    log_pwa("Verification failed. Exiting unsupported browser !");
  }
};

function initAndCreateConfig(swPath, config) {
  const idbOpenRequest = window.indexedDB.open(DB_NAME);
  // DDL - Define schemas
  // Init and Indexed DB and create an object store for the config object
  // This happens only the first time for a new browser
  idbOpenRequest.onupgradeneeded = function(event) {
    const idbDatabase = event.target.result;
    if (!idbDatabase.objectStoreNames.contains(CONFIG_OBJECT_STORE)) {
      idbDatabase.createObjectStore(CONFIG_OBJECT_STORE, { keyPath: "id" });
    }
  };
  // DML
  // This is called each time the app is loaded
  // Check if a config object exists, if not create one
  idbOpenRequest.onsuccess = function(event) {
    log_pwa("Successfully opened IDB named:" + DB_NAME);
    const idbDatabase = event.target.result; //IDBDatabase
    const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], "readwrite");
    const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
    log_pwa(
      "Retrieving config object from the Object Store named:" +
        CONFIG_OBJECT_STORE
    );
    let request = objectStore.get(1);
    request.onsuccess = function(e) {
      let oldConfigObj = e.target.result;
      let newConfigObject;
      if (!oldConfigObj) {
        log_pwa("No existing config object found !");
        if (!config) {
          log_pwa(
            "No config object param either. Hence create a new default config"
          );
          // No existing config object. Neither was a new one passed
          // Create a new default config object and persist
          newConfigObject = createDefaultConfigObject();
          objectStore.add(newConfigObject);
        } else {
          log_pwa("Persist the config object param to the Object Store");
          // use the passed config object and persist
          newConfigObject = config;
          objectStore.add(newConfigObject);
        }
      } else {
        //Use the new config.

        if (config) {
          log_pwa(
            "Found existing config & config obj param. Use param as source of truth"
          );
          //TBD - perform upgrade actions based on diff
          newConfigObject = config;
          objectStore.add(newConfigObject);
        }
      }
      log_pwa(
        "Config Object added to the object store. Proceed to register Service Worker at path:" +
          swPath
      );
      registerServiceWorker(swPath);
    };
  };
}
function createDefaultConfigObject() {
  let cfg = Config.getDefaultConfig();
  return cfg;
}

/*
 * Export the public API
 */
export default moduleExports;
