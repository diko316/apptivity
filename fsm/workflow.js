'use strict';

var DEFINE = require('./define.js'),
    ITERATOR = require('./iterator.js'),
    PROMISE = require('bluebird');

function create(config) {
    var instance, Class;
    
    if (config instanceof Array) {
        Class = extend(Workflow.prototype, DEFINE(config));
        return Class;
    }
    
    
    
}



function extend(Superinstance, definition) {
    var E = empty,
        hasOwn = Object.prototype.hasOwnProperty,
        transitions = definition.transitions,
        reduceStates = definition.reduce,
        map = definition.map,
        methodIndex = {},
        allMethods = {};
        
    var Prototype, name, item, method, methodInput, methodId, state;
    
    function Workflow() {
        this.iterator = ITERATOR(definition);
    }
    
    E.prototype = Superinstance;
    Workflow.prototype = Prototype = new E();
    
    console.log(definition);
    
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
    
    var stateCallbacks = definition.callbacks,
        guardMethods = definition.guard,
        guards = {},
        callbacks = {};
    
    return function () {
        
        var me = this,
            iterator = me.iterator,
            next = iterator.lookup(action),
            P = PROMISE,
            promise = null;
        var transition, id, args;
        
        if (next) {
            args = arguments;
            id = iterator.get() + ' > ' + action;
            transition = definition.transitions[id];
            
            // guard and iterate
            if (id in guardMethods) {
                if (!(id in guards)) {
                    guards[id] = P.method(guardMethods[id].callback);
                }
                promise = guards[id].apply(me, args).
                            then(function () {
                                iterator.next(action);
                            });
            }
            // directly iterate
            else {
                iterator.next(action);
            }
            
            // callback
            if (!(id in callbacks)) {
                callbacks[id] = id in stateCallbacks ?
                                    P.method(stateCallbacks[id]) :
                                    defaultCallback;
            }
            return (promise ?
                        promise.
                            then(function () {
                                    return callbacks[id].apply(me, args);
                                }) :
                            
                        callbacks[id].apply(me, args)).
        
                    then(function (data) {
                            var reducedAction = iterator.reduce();
                            if (reducedAction) {
                                iterator.reset();
                                return all[reducedAction].call(me, data);
                            }
                            return data;
                        });

        }
        return P.reject('unable to process [' + action + ']');
    };
}

function empty() {
    
}

function Workflow() {
    
}

Workflow.prototype = {
    iterator: void(0),
    constructor: Workflow
};

// augment default callback
defaultCallback = PROMISE.method(defaultCallback);

module.exports = create;