'use strict';

var START_STATE = 'start';

function define(tokens) {
    var l = tokens.length,
        c = -1,
        
        startState = START_STATE,
        finalReduceState = null,
        
        reduceState = null,
        reduceStateCallback = null,
        state = startState,
        guard = null,
        transition = null,
        
        DESCRIPTION = 1,
        STATE = 2,
        INPUT = 3,
        GUARD = 4,
        CALLBACK = 5,
        definition = {
            startState: startState,
            map: {
                'start': {}
            },
            callbacks: {},
            guard: {},
            reduce: {},
            transitions: {},
            
            stateGen: 0,
            stateDescription: {}
            
        },
        transitionCallbacks = definition.callbacks;
        
    var token, flag, id, list;
    
    for (; l--;) {
        token = tokens[++c];

        if (!token) {
            continue;
        }
        flag = null;
        if (typeof token === 'string') {
            switch (token.charAt(0)) {
            case '#':
                flag = DESCRIPTION;
                break;
            case '>':
                flag = INPUT;
                break;
            case '[':
                if (token.charAt(token.length - 1) === ']') {
                    flag = GUARD;
                    break;
                }
            /* fall through */
            default:
                if (token === startState) {
                    throw new Error(
                            "[" + startState + "] is a reserved state name");
                }
                flag = STATE;
                break;
            }
        }
        else if (token instanceof Function) {
            flag = CALLBACK;
        }
        else {
            throw new Error("invalid [token] parameter " + token);
        }
        
        
        
        // parse input
        switch (flag) {
        case STATE:
            // reduce what is left, and add description
            if (transition) {
                updateReducer(definition, transition, reduceState, reduceStateCallback);
                if (guard) {
                    updateGuard(definition, transition, guard);
                }
            }
            else if (!finalReduceState) {
                finalReduceState = token;
            }
            reduceState = token;
            state = startState;
            guard = transition = guard;
            break;
        
        case GUARD:
            if (!reduceState) {
                throw new Error(
                    'unable to find transition to guard [' + token + ']');
            }
            else if (guard) {
                throw new Error('guard [' + guard.name + '] is already defined');
            }
            guard = {
                name: token,
                callback: null,
                description: []
            };
            transition = null;
            break;
        
        case INPUT:
            if (!reduceState) {
                throw new Error(
                    'unable to find reduce state of [' + token + '] input');
            }
            token = token.substring(1, token.length);
            
            transition = {
                id: state + ' > ' + token,
                state: state,
                input: token,
                description: []
            };
            
            // change current state
            state = updateTransition(definition, transition);
            
            if (guard) {
                updateGuard(definition, transition, guard);
            }

            guard = null;
            
            break;
        
        case CALLBACK:
            
            // used for transition
            if (transition) {
                id = transition.id;
                
                if (id in transitionCallbacks) {
                    throw new Error(
                        'callback is already defined in ' + transition.input);
                }
                
                transitionCallbacks[id] = token;

            }
            
            // used for guard
            else if (guard) {
                
                if (guard.callback) {
                    throw new Error(
                        'guard is already defined [' + guard.name + ']');
                }
                guard.callback = token;
            
            }
            
            // used for source
            else if (reduceState) {
                
                if (reduceStateCallback) {
                    throw new Error(
                        'callback is already defined in ' + reduceState);
                }
                reduceStateCallback = token;
                
            }
            break;
        
        
        case DESCRIPTION:
            
            // used for transition
            if (transition) {
                list = transition.description;
            }
            
            // used for guard
            else if (guard) {
                list = guard.description;
            }
           
            // used for source
            else if (reduceState) {
                list = definition.stateDescription;
                id = ':' + reduceState;
                if (!(id in list)) {
                    list[id] = [];
                }
                list = list[id];
            }
            
            // nothing to describe
            else {
                throw new Error('unable to find item to describe');
            }
            
            list[list.length] = token;
            
            break;
        
        }
        
    }
    
    if (transition) {
        updateReducer(definition, transition, reduceState, reduceStateCallback);
        if (guard) {
            updateGuard(definition, transition, guard);
        }
        definition.finalReduce = finalReduceState;
    }
    
    //console.log(require('util').inspect(definition, { showHidden: true, depth: 10 }));
    //console.log(definition);

    return definition;
    
}

function updateReducer(definition, transition, reduceState, callback) {
    var reducers = definition.reduce,
        map = definition.map,
        callbacks = definition.callbacks,
        state = map[transition.state][transition.input];
    
    reducers[state] = reduceState;
    
    reducers[':' + reduceState] = state;
    
    // create callback
    if (callback) {
        callbacks[state] = callback;
    }
}

function updateGuard(definition, transition, guard) {
    definition.guard[transition.state + ' > ' + transition.input] = guard;
    
}

function updateTransition(definition, transition) {
    
    var map = definition.map,
        transitions = definition.transitions,
        current = transition.state,
        input = transition.input,
        state = map[current];
        
    var nextState;
   
    if (!Object.prototype.hasOwnProperty.call(state, input)) {
        nextState = 'state' + (++definition.stateGen);
        state[input] = nextState;
    }
    else {
        nextState = state[input];
    }
    
    if (!(nextState in map)) {
        map[nextState] = {};
    }
    
    transitions[current + ' > ' + input] = transition;
    
    return nextState;

}



module.exports = define;
