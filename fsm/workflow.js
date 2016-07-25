'use strict';

var DEFINE = require('./define.js'),
    ITERATOR = require('./iterator.js'),
    PROMISE = require('bluebird');

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
    
    // create methods
    for (name in transitions) {
        if (hasOwn.call(transitions, name)) {
            item = transitions[name];
            methodInput = item.input;
            methodId = ':' + methodInput;
            if (!(methodId in methodIndex)) {
                
                method = createMethod(definition, item.input, allMethods);
                
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

function defaultCallback(data) {
    return data;
}

function createMethod(definition, action, all) {
    
    var guards = {},
        callbacks = {};
    
    return function () {
        
        var me = this,
            def = definition,
            stateCallbacks = def.callbacks,
            guardMethods = def.guard,
            reduceIndex = def.reduce,
            iterator = me.iterator,
            next = iterator.lookup(action),
            P = PROMISE,
            promise = null,
            rid = null;
        var transition, id, args;
        
        if (next) {
            args = arguments;
            id = iterator.get() + ' > ' + action;
            transition = def.transitions[id];
            
            // guard and iterate
            if (id in guardMethods) {
                if (!(id in guards)) {
                    guards[id] = P.method(guardMethods[id].callback);
                }
                promise = guards[id].apply(me, args);
            }
            
            // callback
            if (!(id in callbacks)) {
                callbacks[id] = id in stateCallbacks ?
                                    P.method(stateCallbacks[id]) :
                                    defaultCallback;
            }
            
            // is reducable
            if (next in reduceIndex) {
                rid = reduceIndex[next];
                
                if (next in stateCallbacks && !(next in callbacks)) {
                    callbacks[next] = P.method(stateCallbacks[next]);
                }
                
            }
            
            return (promise ?
                        promise.
                            then(function () {
                                    return callbacks[id].apply(me, args);
                                }) :
                            
                        callbacks[id].apply(me, args)).
        
        
                    then(function (data) {
                        var nextState = next,
                            list = callbacks,
                            reduceAction = rid;
                        
                        // iterate and return if cannot reduce
                        if (!reduceAction) {
                            iterator.next(action);
                            return data;
                        }
                        
                        // reduce by reset and apply reduce action
                        if (!(nextState in list)) {
                            iterator.reset();
                            return all[reduceAction].call(me, data);
                        }
                        
                        // call handler before reduce action
                        return list[nextState].call(me, data).
                                    then(function (data) {
                                        iterator.reset();
                                        return all[reduceAction].call(me, data);
                                    });
                    });

        }
        return P.reject('unable to process [' + action + ']');
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

// augment default callback
defaultCallback = PROMISE.method(defaultCallback);

module.exports = create;
