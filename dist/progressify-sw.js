var progressify = (function () {
    'use strict';

    function log_sw(msg){
        console.log('%c progressify: Service Worker  ','background:orange;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
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

    const CACHE_NAME = "progressify-cache";
    // constants
    const ACTION_CACHE='1';
    const ACTION_DONT_CACHE='2';


    class Router {
      constructor(config) {
        this.config = config;
      }

      route(fetchEvent) {
        log_sw("---Router Fetch Event START---" + fetchEvent.timeStamp);
        log_sw("fetchEvent.request.method =>" + fetchEvent.request.method);
        log_sw("fetchEvent.request.url =>" + fetchEvent.request.url);
        if (fetchEvent.request.method != "GET") {
          //NOOP for anything but a GET
          log_sw("Not a GET. Hence NOOP and return");
          fetchEvent.respondWith(fetch(fetchEvent.request));
          log_sw("---Router Fetch Event END---" + fetchEvent.timeStamp);
          return;
        }
        const r = this.determineAction(fetchEvent.request.url);
        // return {'action':<ACTION_CONSTANT>,opts:<opts_obj>}
        this.processAction(r.action,fetchEvent,r.opts);
      }

      // Once the right action has been determined, this method processes the fetchEvent appropriately
      processAction(action,fetchEvent,opts){

        switch(action){

          case  ACTION_CACHE:
            this.processCached(fetchEvent,opts);
            break;
          
          case  ACTION_DONT_CACHE:  
            this.processNotCached(fetchEvent,opts);
            break;

        }
      }

      // Determines the apporpriate action that needs to be 
      // taken for this GET URL. Returns an array of Action and options
      // return {'action':<ACTION_CONSTANT>,opts:<opts_obj>}
      determineAction(url) {

         let returnVal = {}; 
         returnVal.action=ACTION_DONT_CACHE;
         for (var pathEntry of this.config.cache) {
           const p = pathEntry.p;
           log_sw(
             "Matching :" + url+ " with :" + p
           );
           if (url.match(p)) {
             log_sw("Match found. Breaking loop !");
             returnVal.action=ACTION_CACHE;
             if(pathEntry.o){
              returnVal.opts=pathEntry.o;
             }
             break;
           }
         }     
         return returnVal;
      }

      processCached(fetchEvent,opts) {
        var self = this;
        log_sw("Processing Cached Path: " + fetchEvent.request.url);
        fetchEvent.respondWith(
          caches.match(fetchEvent.request).then(function(response) {
            if (response) {
              // The response has been found in cache. However, we still need to revalidate
              self.revalidate(fetchEvent);
              log_sw("Responding from cache");
              return response;
            } else {
              log_sw("No cached copy yet. Retrieve from network and cache a clone");
              return fetch(fetchEvent.request).then(function(newResponse) {
                return caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(fetchEvent.request.url, newResponse.clone());
                  log_sw("---Router Fetch Event END---" + fetchEvent.timeStamp);
                  return newResponse;
                });
              });
            }
          })
        );
      }

      processNotCached(fetchEvent,opts) {
        log_sw("Processing NOT Cached Path: " + fetchEvent.request.url);
        fetchEvent.respondWith(fetch(fetchEvent.request));
        log_sw("---Router Fetch Event END---" + fetchEvent.timeStamp);
      }

      revalidate(fetchEvent){
        log_sw("Revalidate initated for :"+fetchEvent.request.url);
        fetch(fetchEvent.request).then(function (newResponse){
          log_sw("Revalidate response received :"+fetchEvent.request.url);
          caches.open(CACHE_NAME).then(function(cache){
            log_sw("Revalidate cache update :"+fetchEvent.request.url);
            cache.put(fetchEvent.request.url, newResponse);
          });
        });
      }
    }

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

    return moduleExports;

}());
