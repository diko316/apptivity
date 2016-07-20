'use strict';

var PROMISE = require('bluebird');

function Definition() {
    this.signatures = {};
    this.pending = {};
    this.states = {};
    this.definitions = {
        '[defaultGuard]': this.defaultGuard
    };
}

Definition.prototype = {
    guardIdGen: 0,
    states: void(0),
    definitions: void(0),
    
    constructor: Definition,
    
    defaultGuard: function (data) {
        return data;
    },
    
    define: function () {
        
    },
    
    link: function (from, to, guard) {
        var states = this.states,
            pending = this.pending,
            definitions = this.definitions,
            signatures = this.signatures,
            firstState = this.initialState;
        var id, source, sc, sl, target, tc, tl, stateDefinition, sdl, signature;
        
        if (from && to) {
            
            // create guard
            if (guard instanceof Function) {
                id = '!guard' + (++this.guardIdGen);
                this.definitions[id] = guard;
                guard = id;
            }
            else if (typeof guard === 'string') {
                guard = '[' + guard + ']';
            }
            else if (guard === void(0) || guard === null) {
                guard = '[defaultGuard]';
            }
            else {
                throw new Error('invalid [guard] string|function parameter');
            }
            
            if (!(guard in definitions)) {
                pending[guard] = true;
            }
            
            // insert definition
            if (!(from instanceof Array)) {
                from = [from];
            }
            if (!(to instanceof Array)) {
                to = [to];
            }
            for (sc = -1, sl = from.length; sl--;) {
                
                // create source
                source = from[++sc];
                if (!source || typeof source !== 'string') {
                    throw new Error('invalid [from] string|array parameter');
                }
                
                id = ':' + source;
                
                if (!firstState) {
                    this.initialState = firstState = source;
                }
                
                if (!(id in states)) {
                    states[id] = stateDefinition = [];
                    sdl = 0;
                }
                else {
                    stateDefinition = states[id];
                    sdl = stateDefinition.length;
                }
                
                // create target
                for (tc = -1, tl = to.length; tl--;) {
                    target = to[++tc];
                    if (!target || typeof target !== 'string') {
                        throw new Error(
                                'invalid [from] string|array parameter');
                    }
                    
                    id = ':' + target;
                    signature = ':' + source + id + guard;
                    
                    // filter redundant state transitions
                    if (signature in signatures) {
                        continue;
                    }
                    
                    if (!(id in states)) {
                        states[id] = [];
                    }
                    
                    signatures[signature] = true;
                    stateDefinition[sdl++] = [target, guard];
                    
                    if (!(id in definitions)) {
                        pending[definitions] = true;
                    }
                }
            }
            
        }
        return this;
    }
};

module.exports = Definition;
