import { Config } from "./config.js";
import { log_sw, log_debug } from "./utils.js";

const CACHE_NAME = "progressify-cache";

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

    //Check if this URL needs to be cached
    let isCached = false;
    for (var pathEntry of this.config.cache) {
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

  processNotCached(fetchEvent) {
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
