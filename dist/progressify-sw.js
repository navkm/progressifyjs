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

          /*if(configString){  
            this.config = JSON.parse(configString);
          } else{
              this.config ={};
              this.id=1;
          }
          */
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
            this.config=config;
        }

        route(fetchEvent){
            if(fetchEvent.request.method !='GET'){
                //NOOP for anything but a GET 
                fetchEvent.respondWith(fetch(fetchEvent.request));
                return;
            }
            var requestURL=fetchEvent.request.url;
            //Check if this URL needs to be cached
            for(var pathEntry of this.config.getItemsToCache()){
                log_sw("PATH=>"+pathEntry);
                console.dir(pathEntry);
            }
            fetchEvent.respondWith(
                caches.match(fetchEvent.request).then(function(response){
                    if(response){
                        log_sw('!!FOUND A MATCH FROM CACHE for '+fetchEvent.request.url);
                        return response;
                    } else{
                        log_sw('No response found');
                        return fetch(fetchEvent.request).then(function(newResponse){
                            return caches.open('progressify-cache').then(function(cache){
                                cache.put(requestURL,newResponse.clone());
                                return newResponse;
                            })
                        })
                    }
                    
                })
            );
        
        }
    }

    const DB_NAME = 'progressify';
    const CONFIG_OBJECT_STORE = 'config';

    var router;
    const moduleExports ={};
    moduleExports.sw ={};


    moduleExports.sw.init=()=> {

        log_sw('Hooking up to install event');
        self.addEventListener('install', function (event) {
            var promise = new Promise(function (resolve, reject) {
                const idbOpenRequest = indexedDB.open(DB_NAME);
                idbOpenRequest.onsuccess = function (event) {
                    log_sw('idbOpenRequest.onsuccess called');
                    const idbDatabase = event.target.result; //IDBDatabase
                    const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], 'readonly');
                    const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
                    log_sw('objectStore' + objectStore);
                    let request = objectStore.get(1);
                    request.onsuccess = function (e) {
                        const configObject = e.target.result;
                        router=new Router(Config.fromObject(configObject));
                        log_sw('Router is '+router);    
                    };
                    resolve(idbOpenRequest.result);
                };
                idbOpenRequest.onerror=()=>reject(idbOpenRequest.error);
            });
            event.waitUntil(promise);
        });
        self.addEventListener('activate', function(event){
            log_sw('Service worker is activated');
            return self.clients.claim();
        });
        
       self.addEventListener('fetch', handleFetch);

    };


    function handleFetch(event){
        router.route(event);
    }

    return moduleExports;

}());
