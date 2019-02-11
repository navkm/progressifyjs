import { Config } from "./config.js";
import { log_sw, log_debug } from "./utils.js";

const CACHE_NAME = "progressify-cache";
// constants
const ACTION_CACHE='1';
const ACTION_DONT_CACHE='2';


export class Router {
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
