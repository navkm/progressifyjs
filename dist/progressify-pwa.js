var progressify = (function () {
    'use strict';

    function log_pwa(msg){
        console.log('%c progressify: Web Application ','background:blue;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
    }

    /**
     * 
     *
     * @memberof progressify.pwa
     */
    class Condition {
        constructor(type, value) {
            this.type = type;
            this.value = value;
        }

    }

    /**
     * 
     *
     * @memberof progressify.pwa
     */
    class ConditionFactory {
        constructor() {
            /** 
             * @member {progressify.pwa.Condition} 
             * @description Returns a Condition that always evaulates to true
             * 
            */
            this.ALWAYS = this.getConditionAlways();

            /** 
             * @member {progressify.pwa.Condition} 
             * @description Returns a Condition that always evaulates to false
             * 
            */
            this.NEVER = this.getConditionNever();

        }

        getConditionAlways() {
            return new Condition('boolean', true);
        }

        getConditionNever() {
            return new Condition('boolean', false);
        }

    }

    /**
     * 
     *
     * @memberof progressify.pwa
     */
    class Config {
        
    /**
     * @description The Config object is the fundamental building block of the library.<br/><br/>
     * <div style='font-weight:bold;color:blue;'>
     * const c = progressify.pwa.Config();<br/>
     * progressify.pwa.init(c);<br/>
     * </div><br/>
     */
        constructor() {
            this.id=1;
            this.cache=[];
            this.noCache=[];
            this.preCache=[];
            /** 
             * @member {string} 
             * @description The relative path (from the document root) of the serviceworker javascript file in 
             * your web application. The default swPath is <div style='font-weight:bold;'>/sw.js</div><br/>
             * <div style='font-weight:bold;color:blue;'>
             * const c = progressify.pwa.Config();<br/>
             * c.swPath='/path/to/my/serviceworker.js';<br/>
             * </div><br/>
             * 
            */
            this.swPath='/sw.js';
        }

        /**
         * @description  stringify the config object  
         * 
         */
        toString(){
            return JSON.stringify(this);
        }

        /**
         * @description  Configures the service worker to cache any resource that matches the path expression
         * @param {string} pathExpr A regular expression matching the path that needs to be configured
         */
        cachePath(pathExpr,opts){
            if(!opts || (opts && Object.keys(opts).length === 0)){
                this.cache.push({"p":pathExpr});
            }else{
                this.cache.push({"p":pathExpr,"o":opts});
            }
        }

     
        cacheAllPaths(pathExprArray,opts){
            if(!Array.isArray(pathExprArray)){
                return;
            }
            for(let p of pathExprArray){
                this.cachePath(p,opts);
            }    
        }



        static getDefaultConfig(){
            const config = new Config();
            const opts={'condition':new ConditionFactory().ALWAYS};
            config.cachePath(".*",opts);
            return config;
        }

        // From a JSON Object
        static fromObject(obj){
            const c = new Config();
            c.id = obj.id;
            c.cache = obj.cache;
            c.noCache=obj.noCache;
            c.preCache=obj.preCache;
            c.swPath=obj.swPath;
            return c;
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
      navigator.serviceWorker.register(swPath).then(function () {
        log_pwa("SW successfully registered !");
      });
    }

    /**
     * @description 
     * Initializes the library
     * 
     * @method init
     * @param {progressify.pwa.Config} [config] - The config object
     * @returns void
     * @memberof progressify.pwa
     *
     */
    moduleExports.pwa.init = (config = null) => {
      log_pwa("Verifying if progressify is supported on this browser ..");
      // check for support for IndexedDB and serviceworker
      if (window.indexedDB && navigator.serviceWorker) {
        log_pwa("IndexedDB and ServiceWorkers are supported on this browser");
        initAndCreateConfig(config);
      } else {
        log_pwa("Verification failed. Exiting unsupported browser !");
      }
    };


    function initAndCreateConfig(config) {
      let swPath = null;
      const idbOpenRequest = window.indexedDB.open(DB_NAME);
      // DDL - Define schemas
      // Init and Indexed DB and create an object store for the config object
      // This happens only the first time for a new browser
      idbOpenRequest.onupgradeneeded = function (event) {
        const idbDatabase = event.target.result;
        if (!idbDatabase.objectStoreNames.contains(CONFIG_OBJECT_STORE)) {
          idbDatabase.createObjectStore(CONFIG_OBJECT_STORE, { keyPath: "id" });
        }
      };
      // DML
      // This is called each time the app is loaded
      // Check if a config object exists, if not create one
      idbOpenRequest.onsuccess = function (event) {
        log_pwa("Successfully opened IDB named:" + DB_NAME);
        const idbDatabase = event.target.result; //IDBDatabase
        const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], "readwrite");
        const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
        log_pwa(
          "Retrieving config object from the Object Store named:" +
          CONFIG_OBJECT_STORE
        );
        let request = objectStore.get(1);
        request.onsuccess = function (e) {
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
              swPath = newConfigObject.swPath;
            } else {
              log_pwa("Persist the config object param to the Object Store");
              // use the passed config object and persist
              newConfigObject = config;
              objectStore.add(newConfigObject);
              swPath = newConfigObject.swPath;
            }
          } else {
            log_pwa("An existing config object was found");
            //Use the new config.

            if (config) {
              log_pwa(
                "Found existing config & config obj param. Use param as source of truth"
              );
              //TBD - perform upgrade actions based on diff
              newConfigObject = config;
              objectStore.add(newConfigObject);
            }
            swPath = oldConfigObj.swPath;
          }
          log_pwa(
            "Config Object added to the object store. Proceed to register Service Worker at path:" +
            swPath
          );
          log_pwa(
            "Initializing Progressive Web App. Service Worker registered from path: " +
            swPath
          );
          registerServiceWorker(swPath);
        };
      };
    }

    moduleExports.pwa.Config = () => {
      return new Config();
    };


    moduleExports.pwa.Condition = () => {
      return new Condition();
    };

    moduleExports.pwa.ConditionFactory = () => {
      return new ConditionFactory();
    };

    return moduleExports;

}());
