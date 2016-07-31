'use strict';

var EXPORTS = create,
    WORKFLOWS = {},
    WORKFLOW_ID_GEN = 0;


function create(name) {

    if (!name || typeof name !== 'string') {
        throw new Error('invalid [name] parameter');
    }
    
    return new Definition(name);    
}


function register(name, onInitialize, onConfigure) {
    var Prototype = Definition.prototype;
    var superInitialize, nl;
    
    if (name instanceof Array) {
        nl = name.length;
        onInitialize = onConfigure = null;
        
        if (nl > 2) {
            onConfigure = name[2];
        }
        if (nl > 1) {
            onInitialize = name[1];
        }
        
        name = nl ? name[0] : null;
    }
    
    if (!name || typeof name !== 'string') {
        throw new Error('invalid [name] parameter');
    }
    
    if (!(onInitialize instanceof Function)) {
        onInitialize = null;
    }
    
    if (!(onConfigure instanceof Function)) {
        throw new Error('invalid [onConfigure] parameter');
    }
    
    if (onInitialize) {
        superInitialize = Prototype.initialize;
        Prototype.initialize = function () {
            superInitialize.apply(this, arguments);
            onInitialize.apply(this, arguments);
            return this;
        };
    }
    
    Prototype[name] = function () {
        var args = [this.config];
        args.push.apply(args, arguments);
        onConfigure.apply(this, args);
        return this;
    };
    
    return EXPORTS;
    
}

function Definition(name) {
    var id = 'workflow' + (++WORKFLOW_ID_GEN);
    var config;
    
    WORKFLOWS[id] = this;
    
    this.initialize();
    
    config = this.config;
    config.name = name;
    config.id = id;
    
}

Definition.prototype = {
    config: void(0),
    constructor: Definition,
    initialize: function () {
        this.config = {};
    }
};


module.exports = EXPORTS;
EXPORTS.register = register;