'use strict';

var STATE_GEN_ID = 0,
    FSMS = {},
    EXPORTS = createOrGet,
    ACTIVITY = require('../define/activity.js');

function createOrGet(definition) {
    var list = FSMS,
        id = definition.id;
    var fsm;
    
    if (id in list) {
        return list[id];
    }
    
    list[id] = fsm = new Fsm(definition);
    return fsm;
    
}

function is(fsm) {
    return fsm instanceof Fsm;
}


function Fsm(definition) {
    
    this.ends = {};
    this.map = {};
   
    this.actions = {};
    
    this.populateStates(definition);
}

Fsm.prototype = {
    
    map: void(0),
    start: void(0),
    ends: void(0),
    actions: void(0),
    
    generateState: function (before, pointer) {
        var id = 'state' + (++STATE_GEN_ID);
        this.map[id] = {};
        return {
                id: id,
                pointer: pointer || null,
                before: before || null
            };
    },
    
    populateStates: function (definition) {
        var map = this.map,
            ends = this.ends,
            actions = this.actions,
            mgr = ACTIVITY,
            endId = mgr.end.id,
            queue = definition.config.queue,
            c = -1,
            l = queue.length,
            stack = null,
            monitored = null,
            endState = null,
            states = {};
            
        var item, left, right, pointer, options, option, ol, index,
            actionId, stateId, id, state, target, end, fragment, transition,
            activity, action, merges;
        
        for (; l--;) {
            item = queue[++c];
            
            switch (item) {
            // join
            case '[]':
            case '.':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                state = right.state;
                if (!state) {
                    state = monitored = this.generateState(
                                                    monitored,
                                                    right.pointer);
                    states[state.id] = state;
                    right.state = state;
                    pointer = right.pointer;
                    for (; pointer; pointer = pointer.next) {
                        
                        if (!pointer.from) {
                            pointer.from = state;
                        }
                    }
                }
                
                end = left.end;
                
                for (; end; end = end.next) {
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    for (; pointer; pointer = pointer.next) {
                        // point to end state if it ended
                        if (pointer.item.id === endId) {
                            if (!endState) {
                                endState = monitored = this.generateState(
                                                            monitored);
                                id = endState.id;
                                states[id] = endState;
                                ends[id] = true;
                                endState.action = {
                                    type: 'end'
                                };
                            }
                            pointer.to = endState.id;
                        }
                        else if (!pointer.to) {
                            pointer.to = state.id;
                        }
                    }
                }
                
                if (item === '[]') {
                    activity = left.pointer.item;
                    
                    state.action = {
                        type: activity.type,
                        target: activity.desc,
                        action: activity.id,
                    };
                    
                    state.options = right.options;
                    
                }
                else {
                    activity = right.pointer.item;
                    state.action = {
                        type: 'link',
                        action: activity.id,
                        target: activity.desc
                    };
                    
                }
                
                fragment = {
                    state: left.state,
                    pointer: left.pointer,
                    lastPointer: left.lastPointer,
                    end: right.end,
                    lastEnd: right.lastEnd,
                    options: null,
                    lastOptions: null
                };
                
                stack = {
                    fragment: fragment,
                    before: stack.before
                };
                
                state = state.id;
                activity = left.active;
                
                break;
            
            // join options
            case '|':
                right = stack.fragment;
                stack = stack.before;
                left = stack.fragment;
                
                state = left.state || right.state;
                
                
                
                // create right option
                end = right.end;
                fragment = null;
                for (; end; end = end.next) {
                    target = {
                        pointer: end.fragment.pointer,
                        next: null
                    };
                    fragment = fragment ?
                                    (fragment.next = target) : target;
                }
                
                option = {
                    from: right.pointer,
                    to: fragment,
                    next: null
                };
                
                
                // create left options
                options = left.lastOptions;
                if (!options) {
                   
                    end = left.end;
                    fragment = null;
                    
                    for (; end; end = end.next) {
                        target = {
                                pointer: end.fragment.pointer,
                                next: null
                            };
                        fragment = fragment ?
                                        (fragment.next = target) : target;
                    }
                    
                    options = {
                        from: left.pointer,
                        to: fragment,
                        next: option
                    };
                    
                }
                else {
                    options.next = option;
                }
                
                // join pointer
                left.lastPointer.next = right.pointer;
                
                // join ends
                left.lastEnd.next = right.end;
                
                stack = {
                    fragment: {
                        state: state,
                        pointer: left.pointer,
                        lastPointer: right.lastPointer,
                        end: left.end,
                        lastEnd: right.lastEnd,
                        options: left.options || options,
                        lastOptions: option
                    },
                    before: stack.before
                };
                break;
            
            //  activities
            default:
                activity = mgr(item);
                
                fragment = {
                    active: activity,
                    state: null,
                    options: null,
                    lastOptions: null
                };
                
                fragment.pointer = fragment.lastPointer = {
                    item: activity,
                    to: null,
                    next: null
                };
                
                fragment.end = fragment.lastEnd = {
                    fragment: fragment,
                    next: null
                };

                stack = {
                    fragment: fragment,
                    before: stack
                };
            }
            
            // end
            if (!l && stack) {
                fragment = stack.fragment;
                state = fragment.state;
                
                // create start state
                if (!state) {
                    pointer = fragment.pointer;
                    state = monitored = this.generateState(
                                                monitored,
                                                pointer);
                    states[state.id] = state;
                    pointer.from = state;
                    fragment.state = state;
                    activity = pointer.item;
                    state.action = {
                        type: 'link',
                        action: activity.id,
                        target: activity.desc
                    };
                }
                
                this.start = state.id;
                
                // create end state
                end = fragment.end;
                target = null;
                for (; end; end = end.next) {
                    
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    state = pointer.to;
                    if (!state) {
                        if (!endState) {
                            endState = monitored = this.generateState(
                                                            monitored);
                            id = endState.id;
                            states[id] = endState;
                            ends[id] = true;
                            endState.action = {
                                type: 'end'
                            };
                        }
                        pointer.to = endState.id;
                    }
                    else {
                        ends[state] = true;
                    }
                    
                }
                
                // map states
                for (; monitored; monitored = monitored.before) {
                    state = monitored.id;
                    
                    activity = null;
                    if (monitored.action) {
                        actions[state] = activity = monitored.action;
                        
                    }
                    
                    // create target and options
                    if (monitored.options) {
                        index = {};
                        options = [];
                        ol = 0;
                        activity.options = options;
                        activity.index = index;
                        option = monitored.options;
                        
                        for (; option; option = option.next) {
                            right = option.to;
                            left = option.from;
                            target = left.item.desc;
                            
                            // create options
                            options[ol++] = target;
                            
                            // create wait entry
                            id = left.from.id + ' > ' + target;
                            
                            index[target] = {
                                type: 'link',
                                action: left.item.id,
                                target: target,
                                entry: id
                            };
                            
                            // create wait exit
                            for (; right; right = right.next) {
                                
                                pointer = right.pointer;
                                actionId = pointer.item.desc;
                                stateId = pointer.from.id;
                                //end = stateId + ' > ' + actionId;
                                
                                action = states[stateId].action;
                                
                                if (action.options) {
                                    action = action.index[actionId];
                                }
                                
                                merges = action.merges;
                                if (!merges) {
                                    action.merges = merges = {};
                                }
                                
                                merges[id] = activity.action;
                            }
                        }
                    }
                    
                    // create mapped states
                    pointer = monitored.pointer;
                    transition = map[state];
                    
                    for (; pointer; pointer = pointer.next) {
                        id = pointer.item.desc;
                        if (id in transition) {
                            throw new Error(
                                'Action has conflict [' +
                                    pointer.item.name +
                                    ']');
                        }
                        transition[id] = pointer.to;
                        
                        // action definitions
                        id = state + ' > ' + id;
                        if (!(id in actions)) {
                            actions[id] = {};
                        }
                        
                        actions[id].actionId = pointer.item.id;
                        
                    }

                }
            }
        }
        
        if (!stack || stack.before) {
            console.log('before? ', stack.before);
            throw new Error('invalid action sequence');
        }
        
    },
    
    lookup: function (state) {
        var actions = this.actions;
        
        if (typeof state === 'string' && state in actions) {
            return actions[state];
        }
        return void(0);
    },
    
    target: function (state, actionId) {
        var map = this.map;
        var transition;
        
        if (typeof state === 'string' &&
            typeof actionId === 'string' &&
            state in map) {

            transition = map[state];
            
            if (actionId in transition) {
                return transition[actionId];
            }
        }
        
        return void(0);
    },
    
    action: function (state, actionId) {
        var actions = this.actions;
        var id;
        
        if (typeof state === 'string' && typeof actionId === 'string') {
            id = state + ' > ' + actionId;
            if (id in actions) {
                return ACTIVITY(actions[id].actionId);
            }
        }
        
        return void(0);
        
    }
    
    
};

module.exports = EXPORTS;
EXPORTS.is = is;