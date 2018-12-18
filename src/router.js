
import {Config} from './config.js';
import {log_sw} from './utils.js';


export class Router {
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