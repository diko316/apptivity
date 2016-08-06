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
        map = {},
        states = {};
        
    map[start] = {};
    states[start] = {};
    
    this.actions = {};
    this.start = start;
    this.map = map;
    this.states = {};
    this.ends = {};
    this.pushStates = {};
    this.reduce = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    states: void(0),
    start: void(0),
    ends: void(0),
    reduce: void(0),
    
    generateState: function () {
        return 'state' + (++STATE_GEN_ID);
    },
    
    populateStates: function (definition) {
        
        var states = this.states,
            map = this.map,
            ends = this.ends,
            actions = this.actions,
            state = this.start,
            reducers = this.reduce,
            anchor = state,
            stack = null,
            config = definition.config,
            action = config.start,
            option = null,
            pushState = null,
            popState = null,
            beforeState = null;
                
        var name, id, stateObject, defOption, stop, transition;
        
        for (; action; ) {
            
            // register
            transition = map[state];
            name = action.name;
            id = ':' + name;
            beforeState = state;
            
            // link actions
            if (id in transition) {
                state = transition[id];
            }
            else {
                state = this.generateState();
                transition[id] = state;
                map[state] = {};
                states[state] = {};
            }
            
            
            actions[state + ' > ' + name] = action;
            stateObject = states[state];
            
            
            //console.log('= ', action.name);
            
            // push to stack and evaluate action later
            defOption = action.options;
            if (defOption) {
                
                //console.log(' + ', action.name, ', reduce state: ', reduceState);
                pushState = this.generateState();
                map[pushState] = {};
                
                popState = state;
                
                stack = {
                    action: action,
                    option: option,
                    config: config,
                    state: state,
                    anchor: anchor,
                    before: stack
                };
                
                option = defOption;
                config = option.definition.config;
                action = config.start;
                anchor = state = pushState;
                
                //console.log(' >> ', config.name);
                continue;
            }
            else {
                console.log();
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
                    console.log('next option state: ', popState);
                    //reducers[state] = [reduceState, reduceName];
                    
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
                        //reducers[state] = [reduceState, reduceName];
                        
                        //reduceState = stack.reduce;
                        //reduceName = stack.reduceName;
                        anchor = stack.anchor;
                        state = stack.state;
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
                            //reducers[state] = [reduceState, reduceName];
                            
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