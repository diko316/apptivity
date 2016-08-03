'use strict';

var STATE_GEN_ID = 0;


function Fsm() {
    var start = 'state' + (++STATE_GEN_ID),
        states = {};
        
    states[start] = {};
    
    this.start = start;
    this.states = states;
    this.ends = {};
}

Fsm.prototype = {
    start: void(0),
    states: void(0),
    ends: void(0),
    definitions: void(0),
    link: function (state, input, forcedTarget) {
        var states = this.states;
        var transition, id, newState, inside;
        
        if (state in states) {
            transition = states[state];
            id = ':' + input;
            inside = id in transition;
            
            if (!forcedTarget || typeof forcedTarget !== 'string') {
                forcedTarget = null;
            }
            
            if (inside) {
                
                newState = transition[id];
                
                if (forcedTarget && forcedTarget !== newState) {
                    
                    throw new Error(
                        "There are conflicts in state transition " +
                        "while attempting to force the transition target " +
                        forcedTarget + ' from: ' + state
                    );
                    
                }
                
            }
            else {
                newState = forcedTarget ?
                                forcedTarget : 'state' + (++STATE_GEN_ID);
                transition[id] = newState;
                states[newState] = {};
            }
            return newState;
        }
        
        return void(0);
    },
    end: function (state, name) {
        var states = this.states;
        if (state in states) {
            this.ends[state] = name;
        }
    }
};

module.exports = Fsm;