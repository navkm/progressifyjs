export class Config {
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
        const config = new Config();
        config.addPathToCache(".*");
        return config;
    }
    // From a JSON Object
    static fromObject(obj){
        return new Config(obj.id,obj.cache,obj.version,obj.timestamp,obj.onUpgrade);
    }
}

