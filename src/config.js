import { Condition,ConditionFactory } from "./condition.js";

/**
 * 
 *
 * @memberof progressify.pwa
 */
class Config {
    
/**
 * @description The Config object is the fundamental building block of the library.<br/><br/>
 * <div style='font-weight:bold;color:blue;'>
 * const c = progressify.pwa.Config();<br/>
 * progressify.pwa.init(c);<br/>
 * </div><br/>
 */
    constructor() {
        this.id=1;
        this.cache=[];
        this.noCache=[];
        this.preCache=[];
        /** 
         * @member {string} 
         * @description The relative path (from the document root) of the serviceworker javascript file in 
         * your web application. The default swPath is <div style='font-weight:bold;'>/sw.js</div><br/>
         * <div style='font-weight:bold;color:blue;'>
         * const c = progressify.pwa.Config();<br/>
         * c.swPath='/path/to/my/serviceworker.js';<br/>
         * </div><br/>
         * 
        */
        this.swPath='/sw.js';
    }

    /**
     * @description  stringify the config object  
     * 
     */
    toString(){
        return JSON.stringify(this);
    }

    /**
     * @description  Configures the service worker to cache any resource that matches the path expression
     * @param {string} pathExpr A regular expression matching the path that needs to be configured
     */
    cachePath(pathExpr,opts){
        if(!opts || (opts && Object.keys(opts).length === 0)){
            this.cache.push({"p":pathExpr});
        }else{
            this.cache.push({"p":pathExpr,"o":opts});
        }
    }

 
    cacheAllPaths(pathExprArray,opts){
        if(!Array.isArray(pathExprArray)){
            return;
        }
        for(let p of pathExprArray){
            this.cachePath(p,opts);
        }    
    }



    static getDefaultConfig(){
        const config = new Config();
        const opts={'condition':new ConditionFactory().ALWAYS};
        config.cachePath(".*",opts);
        return config;
    }

    // From a JSON Object
    static fromObject(obj){
        const c = new Config();
        c.id = obj.id;
        c.cache = obj.cache;
        c.noCache=obj.noCache;
        c.preCache=obj.preCache;
        c.swPath=obj.swPath;
        return c;
    }
}

export  {Config};