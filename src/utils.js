

function log_pwa(msg){
    console.log('%c progressify: Web Application ','background:blue;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
}

function log_sw(msg){
    console.log('%c progressify: Service Worker  ','background:orange;color:white;padding: 2px,0.5em;border-radius:0.5em',msg);
}

export {log_pwa,log_sw};


