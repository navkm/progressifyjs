var progressify = (function () {
    'use strict';

    function log_sw(msg){
        console.log('%c progressify: Service Worker  ','background:orange;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
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

        //Check if this URL needs to be cached
        let isCached = false;
        for (var pathEntry of this.config.getItemsToCache()) {
          log_sw(
            "Matching :" + fetchEvent.request.url + " with :" + pathEntry.path
          );
          var mat = fetchEvent.request.url.match(pathEntry.path);
          if (mat) {
            log_sw("Match found. Breaking loop !");
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
        log_sw("Processing Cached Path: " + fetchEvent.request.url);
        fetchEvent.respondWith(
          caches.match(fetchEvent.request).then(function(response) {
            if (response) {
              log_sw("Responding from cache");
              return response;
            } else {
              log_sw("No cached copy yet. Retrieve from network and cache a clone");
              return fetch(fetchEvent.request).then(function(newResponse) {
                return caches.open("progressify-cache").then(function(cache) {
                  cache.put(fetchEvent.request.url, newResponse.clone());
                  log_sw("---Router Fetch Event END---" + fetchEvent.timeStamp);
                  return newResponse;
                });
              });
            }
          })
        );
      }

      processNotCached(fetchEvent) {
        log_sw("Processing NOT Cached Path: " + fetchEvent.request.url);
        fetchEvent.respondWith(fetch(fetchEvent.request));
        log_sw("---Router Fetch Event END---" + fetchEvent.timeStamp);
      }
    }

    const DB_NAME = "progressify";
    const CONFIG_OBJECT_STORE = "config";

    var router;
    const moduleExports = {};
    moduleExports.sw = {};

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
