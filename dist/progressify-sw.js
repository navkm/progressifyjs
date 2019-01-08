var progressify = (function () {
    'use strict';

    function log_debug(msg){
        console.log('%c progressify: Debug  ','background:red;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
    }

    class Config {
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
            const config = new Config();
            config.addPathToCache(".*");
            return config;
        }
        // From a JSON Object
        static fromObject(obj){
            return new Config(obj.id,obj.cache,obj.version,obj.timestamp,obj.onUpgrade);
        }
    }

    const CACHE_NAME = "progressify-cache";

    class Router {
      constructor(config) {
        this.config = config;
      }

      route(fetchEvent) {
        if (fetchEvent.request.method != "GET") {
          //NOOP for anything but a GET
          fetchEvent.respondWith(fetch(fetchEvent.request));
          return;
        }

        //Check if this URL needs to be cached
        let isCached = false;
        for (var pathEntry of this.config.getItemsToCache()) {
          var mat = fetchEvent.request.url.match(pathEntry.path);
          if (mat) {
            isCached = true;
            break;
          }
        }
        if (isCached) {
          this.processCached(fetchEvent);
        } else {
          this.processNotCached(fetchEvent);
        }
      }

      processCached(fetchEvent) {
        var self = this;
        log_debug("1:"+this);
        console.dir(this);
        fetchEvent.respondWith(
          caches.match(fetchEvent.request).then(function(response) {
            if (response) {
              log_debug("2:"+self);
              console.dir(self);
              // The response has been found in cache. However, we still need to revalidate
              self.revalidate(fetchEvent);
              return response;
            } else {
              return fetch(fetchEvent.request).then(function(newResponse) {
                return caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(fetchEvent.request.url, newResponse.clone());
                  return newResponse;
                });
              });
            }
          })
        );
      }

      processNotCached(fetchEvent) {
        fetchEvent.respondWith(fetch(fetchEvent.request));
      }

      revalidate(fetchEvent){
        fetch(fetchEvent.request).then(function (newResponse){
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(fetchEvent.request.url, newResponse);
          });
        });
      }
    }

    const DB_NAME = "progressify";
    const CONFIG_OBJECT_STORE = "config";

    var router;
    const moduleExports = {};
    moduleExports.sw = {};

    moduleExports.sw.init = () => {
      self.addEventListener("install", function(event) {
        var promise = new Promise(function(resolve, reject) {
          const idbOpenRequest = indexedDB.open(DB_NAME);
          idbOpenRequest.onsuccess = function(event) {
            const idbDatabase = event.target.result; //IDBDatabase
            const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], "readonly");
            const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
            let request = objectStore.get(1);
            request.onsuccess = function(e) {
              const configObject = e.target.result;
              router = new Router(Config.fromObject(configObject));
            };
            resolve(idbOpenRequest.result);
          };
          idbOpenRequest.onerror = () => reject(idbOpenRequest.error);
        });
        event.waitUntil(promise);
      });
      self.addEventListener("activate", function(event) {
        return self.clients.claim();
      });
      self.addEventListener("fetch", handleFetch);
    };

    function handleFetch(event) {
      router.route(event);
    }

    return moduleExports;

}());
