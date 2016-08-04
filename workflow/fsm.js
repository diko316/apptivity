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
    var start = 'state' + (++STATE_GEN_ID),
        states = {};
        
    states[start] = {};
    
    this.actions = {};
    this.start = start;
    this.states = states;
    this.ends = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    start: void(0),
    states: void(0),
    ends: void(0),
    
    populateStates: function (definition) {
        
        var states = this.states,
            ends = this.ends,
            actions = this.actions,
            start = this.start,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null;
                
        var state, defOption, config, stop;
        
        
        
        for (; action; ) {
            // link actions
            console.log('= ', action.name);
            
            // push to stack and evaluate action later
            defOption = action.options;
            if (defOption) {
                stack = {
                    action: action,
                    option: option,
                    config: config,
                    before: stack
                };
                console.log(' +', action.name);
                option = defOption;
                config = option.definition.config;
                action = config.start;
                console.log(' >> ', config.name);
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
                    // link
                    console.log('>> ', config.name);
                    continue;
                }
                
                // pop stack until there's action
                for (stop = false; stack && !stop; stack = stack.before) {
                    
                    // reduce
                    console.log(' -', stack.action.name);
                    
                    
                    // iterate action
                    action = stack.action;
                    if (action.next) {
                        option = stack.option;
                        config = stack.config;
                        action = action.next;
                        stop = true;
                    }
                    else {
                        // iterate options
                        option = stack.option;
                        if (option && option.next) {
                            option = option.next;
                            config = option.definition.config;
                            action = config.start;
                            stop = true;
                        }
                    }
                    
                }
                
            }
            
        }

    }
    
};

module.exports = EXPORTS;