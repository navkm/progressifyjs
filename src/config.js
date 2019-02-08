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
     * @description  Adds a given path to the cache
     * @param {string} path The pathname that needs to be cached
     */
    addPathToCache(path){
       this.cache.push({"path":path});
    }

    /**
     * 
     * @description Clear cached paths
     * @return void
     */
    clearCachedPaths(){
        //this.cache.push({"path":path});
     }


    static getDefaultConfig(){
        const config = new Config();
        config.addPathToCache(".*");
        return config;
    }

    // From a JSON Object
    static fromObject(obj){
        const c = new Config();
        c.id = obj.id;
        c.cache = obj.cache;
        return c;
    }
}

export  {Config};