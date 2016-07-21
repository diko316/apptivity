'use strict';

var START_STATE = '@root';

function define() {
    var tokens = arguments,
        l = tokens.length,
        c = -1,
        
        startState = START_STATE,
        
        state = null,
        from = startState,
        to = null,
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
            guardNames: {},
            description: {
                guard: {},
                transition: {},
                state: {}
            }
        },
        map = definition.map,
        guardNames = definition.guardNames,
        descriptions = definition.description;
        
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
        
        switch (flag) {
        case STATE:
            from = startState;
            to = guard = callback = null;
            state = token;
            break;
        
        case INPUT:
            if (!state) {
                throw new Error(
                    'unable to find target state of [' + token + '] input');
            }
            
            if (to) {
                from = to;
            }
            
            to = token.substring(1, token.length);
            updateTransition(definition, from, to, state);
            
            // must be unique
            id = ':' + from + ':' + to;
            if (id in map) {
                throw new Error(
                    'transition already exist [' + from + '] -> [' + to + ']');
            }
            guard = callback = null;
            break;
        
        case GUARD:
            if (!state || !to) {
                throw new Error(
                    'unable to find transition to guard [' + token + ']');
            }
            else if (guard) {
                throw new Error('guard [' + guard + '] is already defined');
            }
            guardNames[':' + from + '>' + to] = guard = token;
            callback = null;
            break;
        
        case DESCRIPTION:
            
            // used for guard
            if (guard) {
                id = ':' + from + '>' + to;
                list = descriptions.guard;
            }
            
            // used for target
            else if (to) {
                id = ':' + from + '>' + to;
                list = descriptions.transition;
            }
            
            // used for source
            else if (state) {
                id = ':' + state;
                list = descriptions.state;
            }
            
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
    
    
}



function updateTransition(definition, from, to, state) {
    console.log(from, ' > ', to, ' target:... ', state);
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

