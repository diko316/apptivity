'use strict';

var FSM = require('./fsm.js'),
    FRAME = require('./frame.js'),
    //ACTIVITY = require('../define/activity.js'),
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
        
        return Promise.reject('activity not found ' + state + ' > ' + action);
    },
    
    exec: function (state, action, data, guard) {
        var me = this,
            fsm = me.fsm,
            Promise = PROMISE;
            
        var activity, nextState, handler,
            promise, promises, c, l, options, responses, callback;
        
        activity = fsm.info(state, action);
        if (!activity) {
            return Promise.reject('activity not found');
        }
        nextState = activity.state;
        action = activity.action;
        
        switch (action.type) {
        case 'action':
            promise = guard !== false ?
                        me.guard(state, action.desc, data).
                            then(function () {
                                return data;
                            }) : Promise.resolve(data);
            
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
                        return me.exec(nextState, action.desc, data, false);
                    });
        
        case 'fork':
            options = activity.options;
            responses = {};
            promise = Promise.resolve(data);
            promises = [];
            callback = function (state, action, data) {
                var name = action.substring(1, action.length);
                //return me.guard(state, action, data).
                //        then(function (action) {
                //            return me.exec(state, action.desc, data);
                //        }).
                //        then(function (data) {
                //            responses[name] = data;
                //        });
                        
                return me.exec(state, action, data).
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
                            processState: activity.processState,
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
    
    next: function (data) {
        
        var Promise = PROMISE,
            Frame = FRAME,
            frame = this.frame,
            hasData = !!arguments.length;
        var currentFrame;
        
        if (!hasData) {
            data = {};
        }
        
        if (Object.prototype.toString.call(data) !== '[object Object]') {
            return Promise.reject(new Error('invalid data'));
        }
        
        // create one
        if (!frame) {
            frame = new Frame(this);
            frame.set(this.fsm.start, null);
            frame.load(data);
        }
        else if (frame.end) {
            console.log('stop at this point!');
            return Promise.resolve(this.response);
            
        }
        else {
            currentFrame = frame;
            
            if (!frame.allowNext()) {
                return Promise.reject(new Error('current frame is locked'));
            }
            
            if (frame.next) {
                frame = frame.next;
                frame.load(hasData ? data : currentFrame.response);
            }
            else if (hasData) {
                frame = frame.createNext(data);
            }
            else {
                frame = frame.createNext();
            }
            
            if (!frame.allowRun()) {
                return Promise.reject(new Error('current frame is locked'));
            }

        }
        
        this.frame = frame;
        
        return frame.run();
        
    },
    
    start: function () {
        //this.next(data);
        
    },
    
    stop: function () {
        
    }
    
};


module.exports = Session;