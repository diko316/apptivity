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
    var start = 'start',
        map = {};
    
    map[start] = {};
    this.start = start;
    this.ends = {};

    this.map = map;
    
    
    this.states = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    states: void(0),
    
    generateState: function () {
        var id = 'merge' + (++STATE_GEN_ID);
        this.map[id] = {};
        return id;
    },
    
    populateStates: function (definition) {
        
        var map = this.map,
            states = this.states,
            state = this.start,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            merge = null,
            stateBefore = null,
            lastAction = null,
            option = null;
                
        var id, defOption, transition, guard, ends, inState;
        
        for (; action; ) {
            lastAction = action;
            stateBefore = state;
            
            // create transition
            transition = map[state];
            id = action.id;
            guard = id + '[' + (action.guardName || action.name) + ']';
            if (guard in transition) {
                throw new Error(
                    'state conflict from transition ' +
                    state + ' to ' +
                    action.type + ':'  + action.name);
            }
            else {
                transition[guard] = id;
                state = id;
                map[state] = {};
            }
            
            
            defOption = action.options;
            inState = stateBefore in states;
            
            // condition option
            if (stateBefore === anchor.id && merge) {
                if (inState) {
                    ends = states[stateBefore].options;
                    ends[ends.length] = action.id;
                }
                else {
                    states[stateBefore] = {
                        type: 'options',
                        options: [action.id]
                    };
                }
            }
            else if (inState) {
                states[stateBefore].target = action.id;
                
            }
            else {
                states[stateBefore] = {
                    type: 'link',
                    target: action.id
                };
            }
            
            // push to stack and evaluate action later
            if (defOption) {
                
                stack = {
                    action: action.next,
                    option: option,
                    config: config,

                    anchor: action,
                    merge: merge,

                    before: stack
                };
                
                //console.log('condition ', )

                // create merge state
                merge = this.generateState();
                states[merge] = {
                    type: 'merge',
                    action: action.id,
                    ends: []
                };
                state = action.id;
                anchor = action;
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                
                
                
                continue;
                
            }
            
            // next
            action = action.next;
            
            for (; !action; ) {
                
                // iterate option
                if (option && option.next) {
                    option = option.next;
                    action = option.definition.config.start;
                    
                    // reduce
                    states[state] = {
                        type: 'reduce',
                        action: anchor.id,
                        target: merge
                    };
                    ends = states[merge].ends;
                    ends[ends.length] = state;
                    //console.log(state, ' = ', anchor.id);
                    state = anchor.id;
                    break;
            
                }
                
                // no more stack
                else if (!stack) {
                    break;
                }
                
                // iterate stack
                action = stack.action;
                option = stack.option;
                
                // reduce
                states[state] = {
                    type: 'reduce',
                    action: anchor.id,
                    target: merge
                };
                

                ends = states[merge].ends;
                ends[ends.length] = state;
                state = merge;
                
                anchor = stack.anchor;
                config = stack.config;
                merge = stack.merge;
                stack = stack.before;

            }
            
            // ended
            if (!action) {
                console.log('state ended ', lastAction);
            }
        }

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