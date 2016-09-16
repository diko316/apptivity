'use strict';

var ACTIVITY = require('../define/activity.js'),
    //FSM = require('./parser.js'),
    EXPORTS = getTransformer,
    TRANSFORMERS = {},
    
    EXPORT_TYPE_STATE = 1,
    EXPORT_TYPE_NODE = 2,
    EXPORT_TYPE_TRANSITION = 3;

function registerTransformer(name, handler) {
    if (!name || typeof name !== 'string') {
        throw new Error("Invalid transformer [name] parameter");
    }
    
    if (!(handler instanceof Function)) {
        throw new Error("Invalid transform [handler] parameter");
    }
    
    TRANSFORMERS[':' + name] = handler;
    handler.transformType = name;
    
    return EXPORTS;
}

function getTransformer(name) {
    var list = TRANSFORMERS;
    var id;
    
    if (!name || typeof name !== 'string') {
        throw new Error("Invalid transformer [name] parameter");
    }
    
    id = ':' + name;
    
    if (id in list) {
        return list[id];
    }
    
    return void(0);
}


function exportFSM(transformer, fsm) {
    var TYPE_STATE = EXPORT_TYPE_STATE,
        TYPE_NODE = EXPORT_TYPE_NODE,
        TYPE_TRANSITION = EXPORT_TYPE_TRANSITION,
        
        translateState = transformStateName,
        translateNode = transformNode,
        translateTransition = transformTransition,
        translateEnd = transformEnd,
        
        stateConverts = {},
        actions = {},
        
        input = {
            type: TYPE_STATE,
            state: fsm.start,
            next: null
        },
        
        lastInput = input,
        resultObject = {},
        
        config = {
            name: fsm.name,
            nodeName: 'action',
            transitionName: 'events',
            startName: 'initial',
            endStatesName: 'ends',
            
            fsm: fsm,
            engine: getTransformer(transformer),
            states: stateConverts,
            actions: actions,
            
            transitions: {},
            nodes: {},
            operation: {
                output: resultObject
            },
            result: resultObject
        };
        
    var type, direction, info, source, target, id, temp,
        items, c, l, item;
    
    // initialize result
    transformInitialize(config, config.name);
    
    for (; input; input = input.next) {
        switch (input.type) {
        case TYPE_STATE:
            source = input.state;
            direction = fsm.lookup(source);
            type = direction.type;
            
            switch (type) {
            case 'link':
                info = fsm.info(source, direction.target);
                id = info.activity.id;
                target = info.state;
                
            /* fall through */
            case 'condition':
            case 'fork':
                items = direction.target;
                if (type === 'link') {
                    items = [items];
                }
                for (c = -1, l = items.length; l--; ) {
                    item = items[++c];
                    info = fsm.info(source, item);

                    id = info.activity.id;
                    target = info.state;
                    
                    // translate state
                    if (!(source in stateConverts)) {
                        translateState(config, source, type);
                    }
                    
                    // queue next actions
                    temp = lastInput;
                    temp.next = {
                        type: TYPE_NODE,
                        state: source,
                        action: id,
                        next: {
                            type: TYPE_STATE,
                            state: target,
                            next: lastInput = {
                                type: TYPE_TRANSITION,
                                source: source,
                                action: id,
                                target: target,
                                next: null
                            }
                        }
                    };
                }
                break;
            
            case 'end':
                translateEnd(config, source);
            }
            
            break;
        
        case TYPE_NODE:
            id = input.action;
            
            if (!(id in actions)) {
                translateNode(config, input.state, id);
            }
            
            break;
        
        case TYPE_TRANSITION:
            
            translateTransition(config,
                                input.source,
                                input.action,
                                input.target);
            break;
            
        }
    }
    
    return config.result;
}


// initialize
function transformInitialize(config, name) {
    var toString = Object.prototype.toString,
        resultObject = config.result,
        result = config.engine('initialize',
                                config.operation,
                                name,
                                config),
        
        isArray = false,
        defaultTransitions = config.transitions,
        transitions = defaultTransitions;
    
    if (toString.call(result) === '[object Object]') {
        
        // finalize transitions
        transitions = result.transitions;
        isArray = transitions instanceof Array;
        if (!isArray && toString.call(transitions) !== '[object Object]') {
            transitions = defaultTransitions;
        }
        
    }
    
    config.arrayTransitions = isArray;
    
    resultObject[config.startName] = null;
    
    resultObject[config.transitionName] = config.transitions = transitions;
        
    // finalize nodes/actions
    resultObject[config.nodeName] = config.nodes;
    
    if (!isArray) {
        resultObject[config.endStatesName] = {};
    }
}


// customize state name
function transformStateName(config, state, type) {
    var result = config.engine('state',
                                    config.operation,
                                    state,
                                    type),
        newName = result && typeof result === 'string' ? result : state;
    
    config.states[state] = newName;
    
    if (config.fsm.start === state) {
        config.result[config.startName] = newName;
    }
    
}

// customize node name
function transformNode(config, state, actionId) {
    var action = ACTIVITY(actionId),
        actionObject = {
            id : actionId,
            name: action.name,
            type: action.type,
            descriptions: action.descriptions || null,
            guard: action.guardName || null,
            handler: action.handlerName || null
        },
        result = config.engine('node',
                                    config.operation,
                                    config.states[state],
                                    actionObject);
    
        
    if (!result || typeof result !== 'string') {
        actionObject.id = result = actionId;
    }
    
    config.actions[actionId] = result;
    config.nodes[result] = actionObject;

}

// add transition
function transformTransition(config, source, action, target) {
    
    var translatedSource = config.states[source],
        translatedTarget = config.states[target],
        translatedAction = config.nodes[config.actions[action]],
        transitions = config.transitions,
        arrayTransitions = config.arrayTransitions,
        
        result = config.engine('transition',
                                        config.operation,
                                        translatedSource,
                                        translatedAction,
                                        translatedTarget);
    
    if (Object.prototype.toString.call(result) !== '[object Object]') {
        result = arrayTransitions ? {
                            from: translatedSource,
                            name: translatedAction,
                            to: translatedTarget
                        } : translatedTarget;
    }
    
    if (arrayTransitions) {
        if (Object.prototype.toString.call(result) !== '[object Object]') {
            result = {
                        from: translatedSource,
                        name: translatedAction,
                        to: translatedTarget
                    };
        }
        transitions[transitions.length] = result;
        
    }
    else {
        if (!result || typeof result !== 'string') {
            result = translatedTarget;
        }
        
        if (!(translatedSource in transitions)) {
            transitions[translatedSource] = {};
        }
        
        transitions[translatedSource][translatedAction] = result;
    }
}

function transformEnd(config, state) {
    var transitions = config.transitions;
    var source;
    
    transformStateName(config, state, 'end');
    
    // not applicable for array transitions
    if (!config.arrayTransitions) {
        
        source = config.states[state];
        
        if (!(source in transitions)) {
            transitions[source] = {};
        }
        
        config.result[config.endStatesName][source] = true;
    }
    
}


module.exports = EXPORTS;
EXPORTS.exportFSM = exportFSM;
EXPORTS.register = registerTransformer;

// register default transformer
registerTransformer('default', require("./transformer/default.js"));