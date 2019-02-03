var progressify = (function () {
    'use strict';

    function log_pwa(msg){
        console.log('%c progressify: Web Application ','background:blue;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
    }

    /**
     * The configuration object
     *
     * @memberof progressify.pwa
     */
    class Config {
        
      /**
       * @description <font color='red'>This constructor is for internal use only</font>. All clients must use 
       * the {@link progressify.pwa.newConfig} method to create a new Config object
       * 
       */
        constructor(id=1,cache=[],version=1,timestamp=(new Date()).getTime(),onUpgrade='flush') {
            this.id=id;
            this.cache=cache;
            this.version=version;
            this.timestamp=timestamp;
            this.onUpgrade=onUpgrade;
        }


        getItemsToCache(){
            return this.cache;
        }

        toString(){
            return JSON.stringify(this);
        }

        addPathToCache(path){
           this.cache.push({"path":path});
        }

        static getDefaultConfig(){
            const config = this.createConfigObject();
            config.addPathToCache(".*");
            return config;
        }

        static createConfigObject(){
            const config = new Config();
            return config;
        }
        // From a JSON Object
        static fromObject(obj){
            return new Config(obj.id,obj.cache,obj.version,obj.timestamp,obj.onUpgrade);
        }
    }

    /**
     * @description The progressifyjs library consists of two distinct components/namespaces:<br/>
     * <ul>
     * <li><font color='#0b18ba'>progressifyjs.pwa</font> is the library that is included in the HTML page </li>
     * <li><font color='#0b18ba'>progressifyjs.sw</font> is the library that is used by the service worker</li>
     * </ul>
     * @namespace  progressify
     *
     */

    const DB_NAME = "progressify";
    const CONFIG_OBJECT_STORE = "config";

    const moduleExports = {};

    /**
     * @description 
     * <p>
     * <font color='#0b18ba'>progressifyjs.pwa</font> is the library that is included in the HTML page.
     *  </p>
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
     * @description 
     * Initializes the library
     * 
     * @method init
     * @param {string} [swPath=/sw.js] - Path to the service worker library
     * @param {progressify.pwa.Config} [config] - The config object
     * @returns void
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
              newConfigObject = Config.getDefaultConfig();
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

    /**
     * @description 
     * This is the recommended Factory method to create a new {@link progressify.pwa.Config} object
     *
     * 
     * @method newConfig
     * @memberof progressify.pwa
     * @return {progressify.pwa.Config}
     *
     */
    moduleExports.pwa.newConfig = () => {
      return Config.createConfigObject();
    };

    return moduleExports;

}());
