'use strict';

function extend(instance, properties) {
    var O = Object.prototype,
        E = empty;
    
    var Prototype, hasOwn, name, SuperClass;
    
    function Activity() {
    }
    
    E.prototype = instance;
    SuperClass = instance.constructor;
    Activity.prototype = Prototype = new E();
    
    if (O.toString.call(properties) === '[object Object]') {
        for (name in properties) {
            if (hasOwn.call(properties, name)) {
                Prototype[name] = properties[name];
            }
        }
    }
    Prototype.constructor = Activity;
    Activity.extend = SuperClass.extend;
    return Activity;
}

function empty() {
    
}

function Activity() {
}

Activity.prototype = {
    constructor: Activity
};

Activity.extend = function (properties) {
    return extend(this.prototype, properties);
};

Activity.is = function (instance) {
    return instance instanceof Activity;
};

module.exports = Activity;
