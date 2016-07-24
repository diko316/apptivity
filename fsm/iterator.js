'use strict';

function create(definition) {
    var transitions = definition.transitions,
        map = definition.map,
        currentState = definition.startState,
        lastTransition = null,
        EXPORTS = {
            get: get,
            list: listAvailableInput,
            transition: transition,
            lookup: lookup,
            next: next,
            reduce: reduce,
            reset: reset
        };
    
    function listAvailableInput() {
        var targets = definition.map[currentState],
            hasOwn = Object.prototype.hasOwnProperty,
            list = [],
            len = 0;
        var name;
        
        for (name in targets) {
            if (hasOwn.call(targets, name)) {
                list[len++] = name;
            }
        }
        return list;
    }
    
    function get() {
        return currentState;
    }
    
    function transition() {
        return lastTransition;
    }
    
    function lookup(action) {
        var current = currentState,
            list = transitions,
            id = current + ' > ' + action;
            
        if (id in list) {
            return map[current][list[id].input];
        }
        return void(0);
    }
    
    function next(action) {
        var nextState = lookup(action);
        
        if (nextState) {
            lastTransition = currentState + ' > ' + action;
            currentState = nextState;
        }
        
        return void(0);
    }
    
    function reduce() {
        var current = currentState,
            reduceStates = definition.reduce;
        
        if (current in reduceStates) {
            return reduceStates[current];
        }
        
        return void(0);
    }
    
    function reset() {
        currentState = definition.startState;
        lastTransition = null;
        return EXPORTS;
    }
    
    return EXPORTS;
    
}


module.exports = create;