var progressify=function(){"use strict";class e{constructor(e=1,t=[],s=1,n=(new Date).getTime(),r="flush"){this.id=e;this.cache=t;this.version=s;this.timestamp=n;this.onUpgrade=r}getItemsToCache(){return this.cache}toString(){return JSON.stringify(this)}addPathToCache(e){this.cache.push({path:e})}static getDefaultConfig(){const t=new e;t.addPathToCache(".*");return t}static fromObject(t){return new e(t.id,t.cache,t.version,t.timestamp,t.onUpgrade)}}const t="progressify-cache";class s{constructor(e){this.config=e}route(e){if(e.request.method!="GET"){e.respondWith(fetch(e.request));return}let t=false;for(var s of this.config.getItemsToCache()){var n=e.request.url.match(s.path);if(n){t=true;break}}if(t){this.processCached(e)}else{this.processNotCached(e)}}processCached(e){var s=this;e.respondWith(caches.match(e.request).then(function(n){if(n){s.revalidate(e);return n}else{return fetch(e.request).then(function(s){return caches.open(t).then(function(t){t.put(e.request.url,s.clone());return s})})}}))}processNotCached(e){e.respondWith(fetch(e.request))}revalidate(e){fetch(e.request).then(function(s){caches.open(t).then(function(t){t.put(e.request.url,s)})})}}const n="progressify";const r="config";var c;const o={};o.sw={};o.sw.init=(()=>{self.addEventListener("install",function(t){var o=new Promise(function(t,o){const i=indexedDB.open(n);i.onsuccess=function(n){const o=n.target.result;const a=o.transaction([r],"readonly");const h=a.objectStore(r);let u=h.get(1);u.onsuccess=function(t){const n=t.target.result;c=new s(e.fromObject(n))};t(i.result)};i.onerror=(()=>o(i.error))});t.waitUntil(o)});self.addEventListener("activate",function(e){return self.clients.claim()});self.addEventListener("fetch",i)});function i(e){c.route(e)}return o}();