'use strict';

var FSM = require('./fsm.js'),
    PROCESSOR = require('./processor.js'),
    ACTIVITY = require('../define/activity.js'),
    PROMISE = require('bluebird'),
    SESSION_GEN_ID = 0;
    
// TODO: create processor

function EMPTY() {
    
}



function Session(fsm) {
    if (!FSM.is(fsm)) {
        throw new Error('invalid [fsm] object parameter');
    }
    this.id = 'sid' + (++SESSION_GEN_ID);
    this.fsm = fsm;
}

Session.prototype = {
    id: void(0),
    fsm: void(0),
    frame: null,
    constructor: Session,
    
    STATUS_UNINTIALIZED: 0,
    STATUS_READY: 1,
    STATUS_RUNNING: 2,
    STATUS_WAIT: 3,
    STATUS_SUCCESS: 4,
    STATUS_FAIL: 5,
    
    guard: function (state, action, data) {
        var activity = this.fsm.info(state, action),
            Promise = PROMISE;
        var guard, promise;
        
        
        if (activity) {
            promise = Promise.resolve(data);
            
            guard = activity.guard;
            if (guard) {
                promise = promise.then(guard);
            }
            return promise.then(function () {
                        return activity.action;
                    });
        }
        
        return Promise.reject('activity not found');
    },
    
    exec: function (state, action, data) {
        var me = this,
            fsm = me.fsm,
            Promise = PROMISE;
            
        var activity, nextState, handler, pid,
            promise, promises, c, l, options, responses, callback;
        
        activity = fsm.info(state, action);
        if (!activity) {
            return Promise.reject('activity not found');
        }
        nextState = activity.state;
        action = activity.action;
        
        switch (action.type) {
        case 'action':
            promise = Promise.resolve(data);
            handler = activity.handler;
            if (handler) {
                promise = promise.then(handler);
            }
            
            return promise.then(function (response) {
                    return {
                        activity: action,
                        from: state,
                        to: nextState,
                        request: data,
                        response: response
                    };
                });
        
        case 'condition':
            return (new Promise(function (resolve) {
                    var options = activity.options,
                        request = data,
                        l = options.length,
                        c = -1,
                        state = nextState,
                        scope = me,
                        fsm = scope.fsm,
                        promise = null,
                        unguarded = null,
                        empty = EMPTY;
                        
                    var option, info;
                    
                    function found(action) {
                        resolve(action);
                        return Promise.reject(null);
                    }
                    
                    function create(state, action, request) {
                        return function () {
                            return scope.guard(state, action, request);
                        };
                    }
                    
                    for (; l--;) {
                        option = options[++c];
                        info = fsm.info(state, option);

                        // make this last proprity
                        if (!info.guard) {
                            if (!unguarded) {
                                unguarded = info.action;
                            }
                            continue;
                        }
                        
                        if (!promise) {
                            promise = scope.guard(state, option, request);
                        }
                        else {
                            promise = promise.then(found,
                                                create(state, option, request));
                        }
                    }
                    
                    if (unguarded) {
                        if (!promise) {
                            promise = scope.guard(state, option, request);
                        }
                        else {
                            promise = promise.then(found,
                                                create(state, option, request));
                        }
                    }
                    
                    promise.
                        then(found).
                        catch(empty);

                })).
                    then(function (action) {
                        return me.exec(nextState, action.desc, data);
                    });
        
        case 'fork':
            options = activity.options;
            responses = {};
            promise = Promise.resolve(data);
            promises = [];
            callback = function (state, action, data) {
                var name = action.substring(1, action.length);
                return me.guard(state, action, data).
                        then(function (action) {
                            return me.exec(state, action.desc, data);
                        }).
                        then(function (data) {
                            responses[name] = data;
                        });
            };
            
            for (c = -1, l = options.length; l--;) {
                promises[++c] = callback(nextState, options[c], data);
            }
            
            return Promise.all(promises).
                    then(function () {
                        return {
                            activity: action,
                            process: activity.process,
                            options: options,
                            from: state,
                            to: nextState,
                            request: data,
                            response: responses
                        };
                    });
        case 'end':
            return Promise.resolve({
                        activity: action,
                        from: state,
                        to: nextState,
                        request: data,
                        response: data
                    });
        }
        
        return Promise.reject(
                    'activity [' + activity.name + '] is bogus');
    },
    
    before: function () {
        
    },
    
    next: function (data) {
        var me = this,
            fsm = me.fsm,
            currentFrame = me.frame,
            processes = me.processes,
            O = Object.prototype,
            READY = me.STATUS_READY;
            
        var direction, state, hasOwn, callback, promises, pl, frame;
        
        if (O.toString.call(data) === '[object Object]') {
            
            if (!currentFrame) {
                state = fsm.start;
                direction = fsm.lookup(state);
                processes = {};
                
                currentFrame = {
                    status: READY,
                    processes: {},
                    previous: null,
                    next: null
                };
                
                currentFrame.processes[state] = {
                    state: state,
                    action: direction.target
                };
                
            }
            
            processes = currentFrame.processes;
            
            // new frame
            frame = currentFrame.next = me.frame = {
                status: me.STATUS_UNINTIALIZED,
                processes: {},
                previous: currentFrame,
                next: null
            };

            hasOwn = O.hasOwnProperty;
            
            callback = function (process, data) {
                me.exec(process.state, process.action, data).
                    then(function (data) {
                        // create process to new frame
                         console.log('processed ', data);
                         
                    });
            };
            
            // run
            pl = 0;
            promises = [];
            for (state in processes) {
                
                if (!hasOwn.call(processes, state)) {
                    continue;
                }
                
                if (!hasOwn.call(data, state)) {
                    continue;
                }
                
                promises[pl++] = callback(processes[state], data[state]);
                
            }
            
            return PROMISE.all(promises);

        }
        
    },
    
    start: function (data) {
        //this.next(data);
        
    },
    
    stop: function () {
        
    }
    
};


module.exports = Session;