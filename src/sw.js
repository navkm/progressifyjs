
import {log_sw} from './utils.js';;
import {Router} from './router.js';
import {Config} from './config.js';

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
            }
            idbOpenRequest.onerror=()=>reject(idbOpenRequest.error);
        });
        event.waitUntil(promise);
    });
    self.addEventListener('activate', function(event){
        log_sw('Service worker is activated');
        return self.clients.claim();
    });
    
   self.addEventListener('fetch', handleFetch);

}


function handleFetch(event){
    router.route(event)
}


/*
 * Export the public API
*/

export default moduleExports;


