
import {log_pwa} from './utils.js';

const DB_NAME = 'progressify';
const CONFIG_OBJECT_STORE = 'config';

const moduleExports ={};
moduleExports.pwa ={};


function registerServiceWorker(swPath) {
    log_pwa('Register SW for path: '+swPath);
    navigator.serviceWorker.register(swPath)
        .then(function () {
        log_pwa('SW successfully registered !');
        });
}

/**
 * @namespace progressify
 * @function pwa_init
 * 
 */
moduleExports.pwa.init=(swPath = '/sw.js')=>{

    window.addEventListener('load', (event) => {
        log_pwa('Initing Progressive Web App after window load');
        // check for support for IndexedDB and serviceworker
        if (window.indexedDB && navigator.serviceWorker) {
            log_pwa('IndexedDB and ServiceWorkers are supported on thie browser');
            initAndCreateConfig(swPath);
        }
    });
}

function initAndCreateConfig(swPath) {
    const idbOpenRequest = window.indexedDB.open(DB_NAME);
    // DDL - Define schemas
    // Init and Indexed DB and create an object store for the config object
    // This happens only the first time for a new browser
    idbOpenRequest.onupgradeneeded = function (event) {
        const idbDatabase = event.target.result;
        if (!idbDatabase.objectStoreNames.contains(CONFIG_OBJECT_STORE)) {
            idbDatabase.createObjectStore(CONFIG_OBJECT_STORE, { keyPath: 'id' });
        }
    }
    // DML
    // This is called each time the app is loaded
    // Check if a config object exists, if not create one
    idbOpenRequest.onsuccess = function (event) {
        let configObject;
        log_pwa('idbOpenRequest.onsuccess called');
        const idbDatabase = event.target.result; //IDBDatabase
        const txn = idbDatabase.transaction([CONFIG_OBJECT_STORE], 'readwrite');
        const objectStore = txn.objectStore(CONFIG_OBJECT_STORE); // IDBObjectStore
        let request = objectStore.get(1);
        request.onsuccess = function (e) {
            if (!e.target.result) {
                configObject = createDefaultConfigObject();
                objectStore.add(configObject);
            } else {
                configObject = e.target.result;
                // tbd upgrade config object if it is default
            }
            log_pwa('Config object in place. Register SW now :'+swPath);
            registerServiceWorker(swPath);
        };
    }
}
function createDefaultConfigObject() {
    let config = {
        id: 1,
        version: 1,
        isDefault: true,
        timestamp: (new Date()).getTime(),
        onUpgrade: 'flush'
    }
    return config;
}


/*
 * Export the public API
*/
export default moduleExports;