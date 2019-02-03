/**
 * The configuration object
 *
 * @memberof progressify.pwa
 */
class Config {
    
  /**
   * @description <font color='red'>This constructor is for internal use only</font>. All clients must use 
   * the {@link progressify.pwa.newConfig} method to create a new Config object
   * 
   */
    constructor(id=1,cache=[],version=1,timestamp=(new Date()).getTime(),onUpgrade='flush') {
        this.id=id;
        this.cache=cache;
        this.version=version;
        this.timestamp=timestamp;
        this.onUpgrade=onUpgrade;
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
        const config = this.createConfigObject();
        config.addPathToCache(".*");
        return config;
    }

    static createConfigObject(){
        const config = new Config();
        return config;
    }
    // From a JSON Object
    static fromObject(obj){
        return new Config(obj.id,obj.cache,obj.version,obj.timestamp,obj.onUpgrade);
    }
}

export  {Config};