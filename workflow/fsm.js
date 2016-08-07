'use strict';

var STATE_GEN_ID = 0,
    FSMS = {},
    EXPORTS = create;


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
    
    this.actions = {};
    this.walkthrough = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    reduce: void(0),
    actions: void(0),
    walkthrough: void(0),
    
    generateState: function () {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return id;
    },
    
    populateStates: function (definition) {
        
        var map = this.map,
            ends = this.ends,
            actions = this.actions,
            state = this.start,
            reducers = this.reduce,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null,
            endState = null,
            mainAction = null;
                
        var id, defOption, stop, transition, descriptions;
        
        for (; action; ) {
            
            // link action
            transition = map[state];
            id = action.id;
            if (id in transition) {
                state = transition[id];
            }
            else {
                state = this.generateState();
                transition[id] = state;
            }
            
            // register
            descriptions = action.descriptions;
            
            actions[id] = action;
            
            defOption = action.options;
            
            // push to stack and evaluate action later
            if (defOption) {
                
                stack = {
                    action: action,
                    option: option,
                    config: config,
                    
                    anchor: anchor,
                    state: endState,
                    
                    mainAction: mainAction,
                    
                    before: stack
                };
                
                mainAction = actions[action.id];
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                anchor = state;
                
                endState = this.generateState();
                
                continue;
                
            }
            
            // next
            action = action.next;
            
            // no more action
            if (!action) {
                
                // iterate option
                if (option && option.next) {
                    option = option.next;
                    action = option.definition.config.start;
                    
                    reducers[state] = [endState, mainAction.name];
                    
                    state = anchor;

                    // link
                    continue;
                }
                
                // pop stack until there's action
                for (stop = false; stack && !stop; stack = stack.before) {
                    
                    // iterate action
                    action = stack.action.next;
                    option = stack.option;
                    
                    if (option && option.next) {
                        option = option.next;
                        action = option.definition.config.start;
                        
                        reducers[state] = [endState, mainAction.name];
                        
                        state = anchor;

                        stop = true;
                        
                    }
                    else {
                        
                        anchor = stack.anchor;
                        reducers[state] = [endState, mainAction.name];
                        
                        config = stack.config;
                        state = endState;
                        endState = stack.state;
                        mainAction = stack.mainAction;

                        if (action) {
                            stop = true;
                        }
                    }
                    
                    
                }
                
            }
            
        }
        
        ends[state] = true;
        console.log('last state: ', state);

    }
    
};








module.exports = EXPORTS;