'use strict';

var PROMISE = require('bluebird');

function Definition() {
    this.signatures = {};
    this.pending = {};
    this.states = {};
    this.handler = {
        '[defaultGuard]': this.defaultGuard
    };
    this.descriptions = {};
}

Definition.prototype = {
    guardIdGen: 0,
    states: void(0),
    handler: void(0),
    descriptions: void(0),
    
    constructor: Definition,
    
    is: function (flag, item) {
        if (item && typeof item === 'string') {
            switch (item.charAt(0)) {
            // guard
            case '[':
                if (item.charAt(item.length - 1) === ']') {
                    return flag === 'guard';
                }
            /* fall through */
            default:
                return flag === 'state';
            }
        }
        return false;
    },
    
    defaultGuard: function (data) {
        return data;
    },
    
    describe: function (state) {
        var descriptions = this.descriptions;
        var items, item, l;
        if (state && typeof state === 'string') {
            switch (state.charAt(0)) {
            // guard
            case '[':
                if (state.charAt(state.length - 1) === ']') {
                    break;
                }
            /* fall through */
            default:
                state = ':' + state;
            }
            items = Array.prototype.slice.call(arguments, 1);
            for (l = items.length; l--;) {
                item = items[l];
                if (!item || typeof item !== 'string') {
                    items.splice(l, 1);
                }
            }
            if (items.length) {
                if (!(state in descriptions)) {
                    descriptions[state] = [];
                }
                descriptions = descriptions[state];
                descriptions.push.apply(descriptions, items);
            }
        }
        return this;
    },
    
    handle: function (state, handler) {
        var pending = this.pending;

        if (state && typeof state === 'string' &&
            handler instanceof Function) {
            switch (state.charAt(0)) {
            // guard
            case '[':
                if (state.charAt(state.length - 1) === ']') {
                    break;
                }
            /* fall through */
            default:
                state = ':' + state;
            }
            
            this.handler[state] = handler;
            
            if (state in pending) {
                delete pending[state];
            }
        }
        return this;
    },
    
    link: function (from, to, guard) {
        var states = this.states,
            pending = this.pending,
            handler = this.handler,
            signatures = this.signatures,
            firstState = this.initialState;
        var id, source, sc, sl, target, tc, tl, stateDefinition, sdl, signature;
        
        if (from && to) {
            
            // create guard
            if (guard instanceof Function) {
                id = '[guard' + (++this.guardIdGen) + ']';
                handler[id] = guard;
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
            
            if (!(guard in handler)) {
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
                    
                    if (!(id in handler)) {
                        pending[id] = true;
                    }
                }
            }
            
        }
        return this;
    }
};

module.exports = Definition;
