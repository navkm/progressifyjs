var progressify = (function () {
    'use strict';

    const DB_NAME = 'progressify';
    const CONFIG_OBJECT_STORE = 'config';
    var configObject;

    const moduleExports ={};
    moduleExports.sw ={};


    moduleExports.sw.init=()=> {
        self.addEventListener('install', function (event) {
            var promise = new Promise(function (resolve, reject) {
                const idbOpenRequest = indexedDB.open(DB_NAME);
                idbOpenRequest.onsuccess = function (event) {
                    const idbDatabase = event.target.result; //IDBDatabase
                    const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], 'readonly');
                    const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
                    let request = objectStore.get(1);
                    request.onsuccess = function (e) {
                        configObject = e.target.result;
                    };
                    resolve(idbOpenRequest.result);
                };
                idbOpenRequest.onerror=()=>reject(idbOpenRequest.error);
            });
            event.waitUntil(promise);
        });
        self.addEventListener('activate', function(event){
            return self.clients.claim();
        });
        
       // self.addEventListener('fetch', handleFetch);

    };

    return moduleExports;

}());
