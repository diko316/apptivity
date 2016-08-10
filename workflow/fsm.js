'use strict';

var STATE_GEN_ID = 0,
    FSMS = {},
    EXPORTS = create,
    ACTIVITY = require('../define/activity.js');


function create(definition) {
    var list = FSMS,
        id = definition.id;
    var fsm;
    
    if (id in list) {
        return list[id];
    }
    
    list[id] = fsm = new Fsm(definition);
    return fsm;
    
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
            queue = definition.config.queue,
            c = -1,
            l = queue.length,
            stack = null,
            monitored = null;
            
        var item, activity, left, right, pointer,
            state, target, end, fragment, transition;
        
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
                    right.state = state;
                    
                }
                
                if (item === '[]') {
                    activity = left.pointer.item;
                    state.type = activity.type;
                    state.action = activity.id;
                    //console.log('[] ', state.id,
                    //            ' << ', left.pointer.item.desc,
                    //            ' < ',
                    //            right.pointer.item.desc, right.pointer.next &&
                    //            right.pointer.next.item.id);
                }
                else {
                    
                    state.type = 'link';
                    state.action = right.pointer.item.id;
                    
                    //console.log('. ', state.id,
                    //    ' << ', left.pointer.item.desc,
                    //    ' < ', right.pointer.item.desc, right.pointer.next &&
                    //    right.pointer.next.item.id);
                }
                
                end = left.end;
                
                for (; end; end = end.next) {
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    for (; pointer; pointer = pointer.next) {
                        if (!pointer.to) {
                            pointer.to = state.id;
                        }
                    }
                }
                
                fragment = {
                    state: left.state,
                    pointer: left.pointer,
                    lastPointer: left.pointer,
                    end: right.end,
                    lastEnd: right.lastEnd
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
                        lastEnd: right.lastEnd
                    },
                    before: stack.before
                };
                break;
            
            //  activities
            default:
                activity = mgr(item);
                
                fragment = {
                    active: activity,
                    state: null
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
                    fragment.state = state;
                    
                    state.type = 'link';
                    state.action = pointer.item.id;
                }
                
                this.start = state.id;
                
                // create end state
                end = fragment.end;
                target = null;
                for (; end; end = end.next) {
                    
                    fragment = end.fragment;
                    pointer = fragment.pointer;
                    
                    for (; pointer; pointer = pointer.next) {
                        state = pointer.to;
                        if (!state) {
                            if (!target) {
                                target = monitored = this.generateState(
                                                                monitored);
                                ends[target.id] = true;
                                target.type = 'end';
                            }
                            pointer.to = target.id;
                        }
                        else {
                            ends[state] = true;
                        }
                    }
                    
                }
                
                // map states
                for (; monitored; monitored = monitored.before) {
                    state = monitored.id;
                    pointer = monitored.pointer;
                    transition = map[state];
                    
                    if (monitored.type) {
                        actions[state] = {
                            type: monitored.type,
                            action: monitored.action || null
                        };
                    }
                    
                    for (; pointer; pointer = pointer.next) {
                        transition[pointer.item.desc] = pointer.to;
                    }
                }
            }
        }
        
        if (!stack || stack.before) {
            throw new Error('invalid action sequence');
        }
        
    },
    
    lookup: function (state, action) {
        var map = this.map;
        var transition;
        
        if (typeof state === 'string' &&
            state in map &&
            typeof action === 'string') {
            
            transition = map[state];
            if (action in transition) {
                return transition[action];
            }
        }
        return void(0);
    }
    
    
};








module.exports = EXPORTS;