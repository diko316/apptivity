'use strict';

var START_STATE = 'start';

function define() {
    var tokens = arguments,
        l = tokens.length,
        c = -1,
        
        startState = START_STATE,
        state = startState,
        finalReduceState = null,
        
        reduceState = null,
        input = null,
        guardName = null,
        guard = null,
        reducer = null,
        
        DESCRIPTION = 1,
        STATE = 2,
        INPUT = 3,
        GUARD = 4,
        CALLBACK = 5,
        definition = {
            map: {
                'start': {}
            },
            guard: {},
            reducer: {},
            reduce: {},
            
            stateGen: 0,
            stateNames: {},
            stateDescription: {},
            
            guardNames: {},
            guardDescription: {}
        },
        guardNames = definition.guardNames,
        stateNames = definition.stateNames;
        
    var token, flag, id, description, list;
    
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
            // reduce what is left
            if (input) {
                updateReducer(definition, state, input, reduceState);
            }
            else if (!finalReduceState) {
                finalReduceState = token;
            }
            reduceState = token;
            state = startState;
            input = guardName = guard = reducer = null;
            break;
        
        case INPUT:
            if (!reduceState) {
                throw new Error(
                    'unable to find reduce state of [' + token + '] input');
            }
            input = token.substring(1, token.length);
            stateNames[state + ' > ' + input] = input;
            
            // change current state
            state = updateTransition(definition, state, input);

            guardName = guard = reducer = null;
            break;
        
        case GUARD:
            if (!input) {
                throw new Error(
                    'unable to find transition to guard [' + token + ']');
            }
            else if (guardName) {
                throw new Error('guard [' + guardName + '] is already defined');
            }
            
            guardNames[state + ' > ' + input] = guardName = token;
            guard = reducer = null;
            break;
        
        case DESCRIPTION:
            
            // used for guard
            if (guardName) {
                id = state + ' > ' + input;
                list = definition.guardDescription;
            }
            
            // used for transition
            else if (input) {
                id = state + ' > ' + input;
                list = definition.stateDescription;
            }
            
            // used for source
            else if (reduceState) {
                id = reduceState;
                list = definition.stateDescription;
            }
            
            // nothing to describe
            else {
                throw new Error('unable to find item to describe');
            }
            
            if (id in list) {
                description = list[id];
                description[description.length] = token;
            }
            else {
                list[id] = [token];
            }
            break;
        
        case CALLBACK:
            // used for guard
            if (guardName) {
                
                id = state + ' > ' + input;
                
                if (guard) {
                    throw new Error(
                        'guard is already defined for transition ' + id);
                }
                
                definition.guard[id] = guard = token;

            }
            
            // used for transition
            else if (input) {
                id = state + ' > ' + input;
                
                if (reducer) {
                    throw new Error(
                        'reducer is already defined for transition ' + id);
                }
                
                definition.reducer[id] = reducer = token;
            }
            
            // used for source
            else if (reduceState) {
                id = reduceState;
                list = definition.stateDescription;
            }
        }
        
    }
    
    if (input) {
        updateReducer(definition, state, input, reduceState);
        definition.finalReduce = finalReduceState;
    }
    
    //if (target) {
    //    updateReducer(definition, currentState, input, target, state);
    //}
    //else if (input) {
    //    updateReducer(definition, currentState, input, null, state);
    //}
    
    console.log(definition);
    return definition;
    
}


function updateReducer(definition, current, input, reduceState) {
    var map = definition.map,
        reducers = definition.reduce;
        
    reducers[current + ' > ' + input] = reduceState;

}

function updateTransition(definition, current, input) {
    
    var map = definition.map,
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
    
    return nextState;

}

function finalize(definition, from, to, state) {
    
}


module.exports = define;
