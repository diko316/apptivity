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
    this.ends = {};
    
    this.states = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    states: void(0),
    
    generateState: function () {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return id;
    },
    
    populateStates: function (definition) {
        
        var map = this.map,
            ends = this.ends,
            state = this.start,
            states = this.states,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null,
            endState = null,
            parentAction = null,
            parentState = null,
            stateBefore = null;
                
        var id, defOption, transition, reference;
        
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
            
            // register sudden death/end state
            if (action.type === 'end') {
                ends[state] = true;
            }
            
            defOption = action.options;
            
            // register option
            if (stateBefore === anchor && parentState) {
                
                reference = states[parentState].options;
                reference[reference.length] = action.id;
                
            }
            // register link
            else if (!defOption) {
                states[stateBefore] = {
                    type: action.type,
                    action: action.id
                };
            }
            
            // push to stack and evaluate action later
            if (defOption) {
                
                stack = {
                    action: action.next,
                    option: option,
                    config: config,
                    
                    anchor: anchor,
                    state: endState,
                    
                    parentState: parentState,
                    parentAction: parentAction,
                    
                    before: stack
                };
                
                parentState = stateBefore;
                parentAction = action;
                
                states[stateBefore] = {
                    type: action.type,
                    action: action.id,
                    target: state,
                    options: []
                };
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                anchor = state;
                
                endState = this.generateState();
                
                continue;
                
            }
            
            // next
            action = action.next;
            
            for (; !action; ) {
                
                // iterate option
                if (option && option.next) {
                    option = option.next;
                    action = option.definition.config.start;
                    
                    states[state] = {
                        type: 'reduce',
                        action: parentAction.id,
                        target: endState
                    };
                    
                    
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
                states[state] = {
                        type: 'reduce',
                        action: parentAction.id,
                        target: endState
                    };
                
                config = stack.config;
                state = endState;
                endState = stack.state;
                parentAction = stack.parentAction;
                parentState = stack.parentState;
                stack = stack.before;
                
            }
            
        }
        
        ends[state] = true;

    },
    
    lookup: function (state) {
        var map = this.map,
            states = this.states;
            
        var activity, action;
        
        if (typeof state === 'string' && state in states) {
            activity = states[state];
            action = ACTIVITY(activity.action);
            console.log('action id ', activity.action, action);
            return {
                state: map[state][action.id],
                activity: activity,
                action: action
            };
            //console.log('transition: ', transition);
        }
        return void(0);
    }
    
};








module.exports = EXPORTS;