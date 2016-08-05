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
    console.log('create!');
    list[id] = fsm = new Fsm(definition);
    return fsm;
    
}


function Fsm(definition) {
    var start = this.generateState(),
        states = {};
        
    states[start] = {};
    
    this.actions = {};
    this.start = start;
    this.states = states;
    this.ends = {};
    this.reduce = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    start: void(0),
    states: void(0),
    ends: void(0),
    reduce: void(0),
    
    generateState: function () {
        return 'state' + (++STATE_GEN_ID);
    },
    
    populateStates: function (definition) {
        
        var states = this.states,
            ends = this.ends,
            actions = this.actions,
            state = this.start,
            reducers = this.reduce,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null,
            reduceState = null,
            reduceName = null;
                
        var name, id, stateObject, defOption, stop, transition;
        
        
        
        for (; action; ) {
            
            // register
            stateObject = states[state];
            name = action.name;
            id = ':' + name;
            transition = state + ' > ' + name;
            
            // link actions
            if (id in stateObject) {
                state = stateObject[id];
            }
            else {
                state = this.generateState();
                stateObject[id] = state;
                states[state] = {};
            }
            
            
            actions[transition] = action;
            
            
            //console.log('= ', action.name);
            
            // push to stack and evaluate action later
            defOption = action.options;
            if (defOption) {
                
                //console.log(' + ', action.name, ', reduce state: ', reduceState);
                reduceState = this.generateState();
                states[reduceState] = {};
                
                stack = {
                    action: action,
                    option: option,
                    config: config,
                    state: state,
                    anchor: anchor,
                    reduce: reduceState,
                    reduceName: reduceName,
                    before: stack
                };
                
                reduceName = config.name;
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                anchor = state;
                
                //console.log(' >> ', config.name);
                continue;
            }
            
            // next
            action = action.next;
            
            // no more action
            if (!action) {
                
                // iterate option
                if (option && option.next) {
                    option = option.next;
                    config = option.definition.config;
                    action = config.start;
                    
                    // reduce!
                    reducers[state] = [reduceState, reduceName];
                    
                    state = anchor;
                    // link
                    //console.log('>> ', config.name);
                    continue;
                }
                
                // pop stack until there's action
                for (stop = false; stack && !stop; stack = stack.before) {
                    
                    // reduce
                    //console.log(' -', stack.action.name);
                    
                    // iterate action
                    action = stack.action;
                    if (action.next) {
                        option = stack.option;
                        config = stack.config;
                        action = action.next;
                        
                        // reduce!
                        reducers[state] = [reduceState, reduceName];
                        
                        reduceState = stack.reduce;
                        reduceName = stack.reduceName;
                        anchor = stack.anchor;
                        state = reduceState;
                        stop = true;
                    }
                    else {
                        // iterate options
                        option = stack.option;
                        if (option && option.next) {
                            option = option.next;
                            config = option.definition.config;
                            action = config.start;
                            
                            // reduce!
                            reducers[state] = [reduceState, reduceName];
                            
                            state = anchor;
                            stop = true;
                        }
                    }
                    
                }
                
            }
            
        }

    }
    
};

module.exports = EXPORTS;