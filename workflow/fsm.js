'use strict';

var STATE_GEN_ID = 0,
    FSMS = {},
    EXPORTS = create,
    ACTIVITY = require('../define/activity.js');


function create(definition) {
    var list = FSMS,
        id = definition.id;
    var fsm;
    
    if (id in list) {
        return list[id];
    }
    
    list[id] = fsm = new Fsm(definition);
    return fsm;
    
}


function Fsm(definition) {
    
    this.map = {};
    this.start = this.generateState();
    this.reduce = {};
    this.ends = {};
    
    this.states = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    reduce: void(0),
    
    generateState: function () {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return id;
    },
    
    populateStates: function (definition) {
        
        var map = this.map,
            ends = this.ends,
            state = this.start,
            reducers = this.reduce,
            states = this.states,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null,
            endState = null,
            mainAction = null,
            stateBefore = null;
                
        var id, defOption, transition;
        
        for (; action; ) {
            
            // link action
            transition = map[state];
            id = action.id;
            stateBefore = state;
            if (id in transition) {
                state = transition[id];
            }
            else {
                state = this.generateState();
                transition[id] = state;
            }
            
            defOption = action.options;
            
            // push to stack and evaluate action later
            if (defOption) {
                
                stack = {
                    action: action.next,
                    option: option,
                    config: config,
                    
                    anchor: anchor,
                    state: endState,
                    
                    mainAction: mainAction,
                    
                    before: stack
                };
                
                mainAction = action;
                states[stateBefore] = {
                    type: action.type,
                    options: state
                };
                
                console.log(stateBefore, ' > ', action.type + ':' + action.name, ' = ', state);
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                anchor = state;
                
                endState = this.generateState();
                
                continue;
                
            }
            else if (stateBefore in states) {
                
                console.log('option: ', stateBefore, '>', action.type + ':' + action.name, ' = ', state);
            }
            else {
                
                console.log('link: ', stateBefore, '>', action.type + ':' + action.name, ' = ', state);
            }
            
            // next
            action = action.next;
            
            for (; !action; ) {
                
                // iterate option
                if (option && option.next) {
                    option = option.next;
                    action = option.definition.config.start;
                    
                    reducers[state] = [endState, mainAction.id];
                    
                    state = anchor;
                    
                    break;
            
                }
                
                // no more stack
                else if (!stack) {
                    break;
                }
                
                // iterate stack
                action = stack.action;
                option = stack.option;
                
                anchor = stack.anchor;
                reducers[state] = [endState, mainAction.id];
                
                config = stack.config;
                state = endState;
                endState = stack.state;
                mainAction = stack.mainAction;
                stack = stack.before;
                
            }
            
        }
        
        ends[state] = true;

    },
    
    lookup: function (currentState, actionId) {
        var map = this.map;
        var transition;
        
        if (currentState in map) {
            transition = map[currentState];
            if (actionId in transition) {
                return transition[actionId];
            }
        }
        return void(0);
    }
    
};








module.exports = EXPORTS;