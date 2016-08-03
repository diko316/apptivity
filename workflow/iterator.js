'use strict';

function Iterator(definition) {
    var config = definition.config;
    
    this.definition = definition;
    this.state = config.fsm.start;
    this.action = config.start;
}

Iterator.prototype = {
    definition: void(0),
    stack: null,
    state: null,
    action: null,
    constructor: Iterator,
    
    next: function () {
        var found = this.lookup();
            
        this.state = found.nextState;
        this.action = found.nextAction;
        
        return found.action;
    },
    
    lookup: function () {
        var config = this.definition.config,
            state = this.state,
            current = this.action,
            fsm = config.fsm,
            ends = fsm.ends,
            action = config.actions[state + ' > ' + current],
            transition = fsm.states[state],
            nextState = transition[':' + current];
            
            
        
        return {
            end: nextState in ends ?
                    ends[nextState] : false,
            nextState: nextState,
            nextAction: action.next,
            state: state,
            action: action
        };

    }
};


module.exports = Iterator;
