'use strict';

var START_STATE = '@root';

function define() {
    var tokens = arguments,
        l = tokens.length,
        c = -1,
        
        startState = START_STATE,
        state = startState,
        
        reduceState = null,
        input = null,
        guard = null,
        callback = null,
        
        DESCRIPTION = 1,
        STATE = 2,
        INPUT = 3,
        GUARD = 4,
        CALLBACK = 5,
        definition = {
            map: {},
            guard: {},
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
            reduceState = token;
            state = startState;
            input = guard = callback = null;
            break;
        
        case INPUT:
            if (!reduceState) {
                throw new Error(
                    'unable to find reduce state of [' + token + '] input');
            }
            input = token.substring(1, token.length);
            id = state + ':' + input;
            stateNames[id] = input;
            
            // change current state
            state = updateTransition(definition, state, input);

            guard = callback = null;
            break;
        
        case GUARD:
            if (!input) {
                throw new Error(
                    'unable to find transition to guard [' + token + ']');
            }
            else if (guard) {
                throw new Error('guard [' + guard + '] is already defined');
            }
            
            guardNames[':' + state + '>' + input] = guard = token;
            callback = null;
            break;
        
        case DESCRIPTION:
            
            // used for guard
            if (guard) {
                id = ':' + state + '>' + input;
                list = definition.guardDescription;
            }
            
            // used for transition
            else if (input) {
                id = ':' + state + '>' + input;
                list = definition.stateDescription;
            }
            
            // used for source
            else if (reduceState) {
                id = ':' + reduceState;
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
            
        }
    }
    
    if (input) {
        updateReducer(definition, state, input, reduceState);
    }
    
    //if (target) {
    //    updateReducer(definition, currentState, input, target, state);
    //}
    //else if (input) {
    //    updateReducer(definition, currentState, input, null, state);
    //}
    
    
    
    
}


function updateReducer(definition, current, input, reduceState) {
    console.log('reduce in ', current, ':', input, ' -> ', reduceState);
}

function updateTransition(definition, current, input, target) {
    var nextState = 'state' + (++definition.stateGen);
    //var map = definition.map;
    //var state, id;
    //
    //id = ':' + from;
    //
    //if (!(id in map)) {
    //    map[id] = state = {};
    //}
    //else {
    //    state = map[id];
    //}
    //
    //id = ':' + to;
    //if (id in state) {
    //    throw new Error(
    //        "transition from [" + from + "] to [" + to + "] has conflict");
    //}
    //state[id] = true;
    console.log('transition in ', current, ': ', input, ' -> ', nextState);
    return nextState;
}

function finalize(definition, from, to, state) {
    
}

console.log('here! ');

define(
    'createUser',
        '>showCreateForm',
            '# launch create form',
        '>submit',
            '# at this stage, this state must wait'
);

