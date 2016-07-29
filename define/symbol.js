'use strict';

var SYMBOLS = {
        symbol: Symbol
    },
    SYMBOL_GEN_ID = 0,
    SYMBOL_IDS = {},
    STATE_GEN_ID = 0,
    EXPORTS = module.exports = create;
    


function create(name, args) {
    var list = SYMBOLS,
        E = empty;
    var instance, Prototype, id;
    
    if (list.hasOwnProperty(name)) {
        if (!args || !args.length) {
            args = [];
        }
        Prototype = list[name].prototype;
        E.prototype = Prototype;
        instance = new E();
        
        // attach id and register
        id = 'symbol' + (++SYMBOL_GEN_ID);
        Prototype.id = id;
        SYMBOL_IDS[id] = instance;
        
        instance.constructor.apply(instance, args);
        return instance;
    }
    
    return void(0);
}

function extend(SuperClass, properties) {
    var E = empty,
        O = Object.prototype,
        hasOwn = O.hasOwnProperty;
    var instance, Prototype, Class, name;
    
    if (SuperClass instanceof Function) {
        //instance = SuperClass.prototype;
        E.prototype = SuperClass.prototype;
        instance = new E();
    }
    else if (SuperClass instanceof Symbol) {
        instance = SuperClass;
        SuperClass = instance.constructor;
    }
    else {
        throw new Error("invalid superclass to extend");
    }
    
    
    E.prototype = instance;
    Prototype = new E();
    
    if (O.toString.call(properties) === '[object Object]') {
        for (name in properties) {
            if (hasOwn.call(properties, name)) {
                Prototype[name] = properties[name];
            }
        }
    }
    Class = createConstructor(SuperClass, Prototype);
    Class.prototype = Prototype;
    Prototype.constructor = Class;
    return Class;
}

function createConstructor(SuperClass, properties) {
    var hasOwn = Object.prototype.hasOwnProperty.call(properties, 'configure');
    function Symbol() {
        SuperClass.apply(this, arguments);
        if (hasOwn) {
            properties.configure.call(this, this.config);
        }
    }
    return Symbol;
}

function empty() {
    
}

function Symbol(name) {
    
    var args;
    
    if (!name || typeof name !== 'string') {
        name = 'Unknown';
        args = arguments;
    }
    else {
        args = Array.prototype.slice.call(arguments, 1);
    }
    
    this.config = {
        name: name,
        description: []
    };
    
    this.initialize.apply(this, args);
}

Symbol.prototype = {
    
    type: 'Unknown',
    config: void(0),
    
    constructor: Symbol,
    
    name: function (name) {
        if (name && typeof name === 'string') {
            this.config.name = name;
        }
        return this;
    },
    
    describe: function () {
        var args = arguments,
            l = args.length,
            c = -1,
            current = this.config.description,
            description = [],
            dl = 0;
        var item;
        
        for (; l--;) {
            item = args[++c];
            if (item && typeof item === 'string') {
                description[dl++] = item;
            }
        }
        if (dl) {
            current.push.apply(current, description);
        }
        return this;
    },
    
    initialize: function () {
    },
    
    process: function () {
        throw new Error('must create implementation');
    }
    
};

EXPORTS.register = function (name, properties) {
    var list = SYMBOLS,
        SuperClass = Symbol,
        O = Object.prototype;
    var Class;
    
    if (name && typeof name === 'string') {
        if (list.hasOwnProperty(name)) {
            throw new Error('[' + name + '] is already defined');
        }
        
        if (O.toString.call(properties) === '[object Object]' &&
            O.hasOwnProperty(properties, '@extend')) {
            SuperClass = properties['@extend'];
            if (list.hasOwnProperty(SuperClass)) {
                SuperClass = list[SuperClass];
            }
            else {
                throw new Error('invalid superclass to extend');
            }
        }
        
        list[name] = Class = extend(SuperClass, properties);
        Class.prototype.type = name;
        
        // create method
        EXPORTS.methods[name] = function () {
            return create(name, arguments);
        };
        
        return Class;
    }
    
    throw new Error('invalid [name] paramter');
    
};

EXPORTS.get = function (id) {
    var list = SYMBOL_IDS;
    return list.hasOwnProperty(id) ? list[id] : void(0);
};

EXPORTS.is = function (name, subject) {
    var list = SYMBOLS;
    
    if (arguments.length < 2) {
        subject = name;
        name = 'symbol';
    }
    
    if (list.hasOwnProperty(name)) {
        return subject instanceof list[name];
    }
    return false;
};

EXPORTS.createState = function () {
    return 's' + (++STATE_GEN_ID);
};

EXPORTS.methods = {};

