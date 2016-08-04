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
                
        var state, defOption;
        
        
        
        for (; action; ) {
            
            console.log('processing ', action.name);
            
            // push to stack and evaluate action later
            defOption = action.options;
            
            if (defOption) {
                console.log('push to stack ', action.name);
                stack = {
                    config: config,
                    option: option,
                    action: action,
                    before: stack
                };
                option = defOption;
                config = option.definition.config;
                action = config.start;
                continue;
            }
            
            action = action.next;
            
            // pop if nothing left
            if (!action) {
                
                // go to next option
                if (option && option.next) {
                    option = option.next;
                    config = option.definition.config;
                    action = config.start;
                }
                // pop option stack
                else if (stack) {
                    console.log('pop stack from: ', stack.action.name);
                    option = stack.option;
                    config = stack.config;
                    action = stack.action.next;
                    stack = stack.before;
                }
                
            }
        }

    }
    
};

module.exports = EXPORTS;