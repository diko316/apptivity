'use strict';

var DEFINE = require('./define.js'),
    ITERATOR = require('./iterator.js'),
    PROMISE = require('bluebird'),
    defaultCallback = PROMISE.method(function (data) {
                        return data;
                    });

function create(config) {
    var Class;
    
    if (config instanceof Array) {
        Class = extend(Workflow.prototype, DEFINE(config));
        return Class;
    }
    
    return void(0);
    
}


function extend(Superinstance, definition) {
    var E = empty,
        hasOwn = Object.prototype.hasOwnProperty,
        transitions = definition.transitions,
        reduceStates = definition.reduce,
        map = definition.map,
        methodIndex = {},
        allMethods = {},
        SuperClass = Superinstance.constructor;
        
    var Prototype, name, item, method, methodInput, methodId, state;
    
    function Workflow() {
        this.iterator = ITERATOR(definition);
        SuperClass.apply(this, arguments);
    }
    
    E.prototype = Superinstance;
    Workflow.prototype = Prototype = new E();
    
    Prototype.$$guard = {};
    Prototype.$$callback = {};
    Prototype.$$reduce = {};
    
    // create methods
    for (name in transitions) {
        if (hasOwn.call(transitions, name)) {
            item = transitions[name];
            methodInput = item.input;
            methodId = ':' + methodInput;
            
            bootstrapTransition(Prototype, definition, item);
            
            if (!(methodId in methodIndex)) {
                
                method = createMethod(item.input, allMethods);
                
                allMethods[methodInput] = method;
                state = map[item.state][methodInput];
                
                // non-reduce input methods can be exposed
                if (!(methodId in reduceStates)) {
                    Prototype[methodInput] = method;
                }
                
            }
        }
    }
    
    Prototype.constructor = Workflow;
    Prototype.valueOf = function () {
        return definition;
    };
    
    return Workflow;
}


function bootstrapTransition(properties, definition, transition) {
    var callbacks = properties.$$callback,
        guards = properties.$$guard,
        reduce = properties.$$reduce,
        P = PROMISE,
        defGuards = definition.guard,
        defCallbacks = definition.callbacks,
        defReducer = definition.reduce,
        id = transition.id,
        next = definition.map[transition.state][transition.input];
    var item;
    
    // define guard
    if (id in defGuards) {
        item = defGuards[id].callback;
        if (item) {
            guards[id] = P.method(item);
        }
    }
    
    // define callback
    if (id in defCallbacks) {
        callbacks[id] = P.method(defCallbacks[id]);
    }
    
    if (next in defReducer) {
        
        reduce[id] = defReducer[next];
        
        if (next in defCallbacks) {
            callbacks['< ' + id] = P.method(defCallbacks[next]);
        }
    }
    
}


function createMethod(action, all) {
    return function () {
        var me = this,
            iterator = me.iterator,
            guards = me.$$guard,
            callbacks = me.$$callback,
            reducers = me.$$reduce,
            input = action,
            next = iterator.lookup(input),
            promise = null,
            args = arguments;
            
        var id, rid;
        
        if (next) {
            
            id = iterator.get() + ' > ' + input;
            
            // guard
            if (id in guards) {
                promise = guards[id].apply(me, args);
            }
            
            // transition
            if (id in callbacks) {
                promise = promise ?
                            promise.
                                then(function () {
                                    return callbacks[id].apply(me, args);
                                })
                            :
                            callbacks[id].apply(me, args);
            }
            else {
                promise = defaultCallback(args[0]);
            }
            
            // reduce
            if (id in reducers) {
                rid = '< ' + id;
                
                if (rid in callbacks) {
                    promise = promise.
                                then(function (data) {
                                    return callbacks[rid].call(me, data);
                                });
                }
                return promise.
                            then(function (data) {
                                iterator.reset();
                                return all[reducers[id]].call(me, data);
                            });
            }
            
            // continue if cannot reduce
            return promise.
                        then(function (data) {
                            iterator.next(action);
                            return data;
                        });
            
        }
        
        return PROMISE.reject('unable to process [' + input + ']');
    };
}

function empty() {
    
}

function Workflow(onPublish) {
    var iterator = this.iterator;
    if (iterator && onPublish instanceof Function) {
        iterator.onPublish = onPublish;
    }
}

Workflow.prototype = {
    iterator: void(0),
    constructor: Workflow
};



module.exports = create;
