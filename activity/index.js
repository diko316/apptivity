'use strict';

var BASE = require('./type/base.js'),
    WORKFLOW = require('./workflow.js'),
    TYPES = {},
    EXPORTS = create;

function register(name, Class) {
    
    var Base = BASE;
    
    if (!name || typeof name !== 'string') {
        throw new Error('invalid [name] string parameter');
    }
    
    if (Object.prototype.toString.call(Class) === '[object Object]') {
        if (Class instanceof Base) {
            Class = Class.extend({});
        }
        else {
            Class = Base.extend(Class);
        }
    }
    
    if (Class instanceof Function &&
        (Class === Base || Class.prototype instanceof Base)) {
        TYPES[name] = Class;
    }
    else {
        throw new Error("invalid [Class] parameter");
    }
    return EXPORTS;
}

function create() {
    
}


module.exports = EXPORTS;
EXPORTS.registerType = register;
