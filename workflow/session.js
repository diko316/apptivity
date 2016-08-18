'use strict';

var FSM = require('./fsm.js'),
    FRAME = require('./frame.js'),
    EventEmitter = require('eventemitter3'),
    ACTIVITY = require('../define/activity.js'),
    PROMISE = require('bluebird'),
    SESSION_GEN_ID = 0;
    
function setPrompt(session, activity) {
    var mgr = ACTIVITY,
        fields = session.fields,
        prompts = session.prompts;
    var id;
    
    if (typeof activity === 'string') {
        activity = mgr(activity);
    }
    
    if (!mgr.is(activity)) {
        throw new Error('Invalid [activity] parameter');
    }
    
    if (activity.type !== 'input') {
        throw new Error(
                '[' + activity.name + '] is not an input activity');
    }
    
    id = activity.id;
    
    if (Object.prototype.hasOwnProperty.call(prompts, id)) {
        throw new Error(
                '[' + activity.name + '] is already registered prompt');
    }
    
    fields[fields.length] = id;
    prompts[id] = activity;
    return session;
}

function EMPTY() {
    
}



function Session(fsm) {
    if (!FSM.is(fsm)) {
        throw new Error('invalid [fsm] object parameter');
    }
    this.id = 'sid' + (++SESSION_GEN_ID);
    this.fields = [];
    this.prompts = {};
    this.fsm = fsm;
    this.event = new EventEmitter();
}

Session.prototype = {
    id: void(0),
    fsm: void(0),
    frame: null,
    fields: void(0),
    prompts: void(0),
    event: void(0),
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
            promise, promises, c, l, options, responses, callback, returnObject;
        
        activity = fsm.info(state, action);
        if (!activity) {
            return Promise.reject('activity not found');
        }
        nextState = activity.state;
        action = activity.action;
        
        switch (action.type) {
        case 'input':
        case 'action':
            promise = guard !== false ?
                        me.guard(state, action.desc, data).
                            then(function () {
                                return data;
                            }) : Promise.resolve(data);
            
            returnObject = {
                        activity: action,
                        from: state,
                        to: nextState,
                        request: data,
                        response: void(0)
                    };
            handler = activity.handler;
            
            if (handler) {
                promise = promise.then(handler);
            }
            
            // for input!
            if (action.type === 'input') {
                //console.log('listening input!');
                promise = promise.then(function () {
                    
                    return new Promise(function (resolve) {
                        var scope = me,
                            event = scope.event;
                        
                        function onAnswer(id, value) {
                            if (id === action.id) {
                                event.removeListener('answer', onAnswer);
                                resolve(value);
                            }
                        }
                        
                        setPrompt(scope, action);
                        event.on('answer', onAnswer);
                        event.emit('prompt', action.name);
                        
                    });
                    
                });
            }
            
            return promise.then(function (response) {
                    returnObject.response = response;
                    return returnObject;
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
            me = this,
            frame = me.frame,
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
            frame = new Frame(me);
            frame.start = false;
            frame.set(me.fsm.start, null);
            frame.load(data);
        }
        else if (!frame.end) {

            currentFrame = frame;
            
            // go to next frame
            if (!frame.allowNext()) {
                return Promise.reject(new Error('current frame is locked'));
            }
            
            if (frame.next) {
                frame = frame.next;
                frame.load(
                    arguments.length ?
                        data : currentFrame.response);
                
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
        
        me.frame = frame;
        
        return frame.run();
        
    },
    
    previous: function (data) {
        var frame = this.frame;
        
        if (!frame) {
            return Promise.reject(
                    new Error('no running frame found'));
        }
        else if (frame.start) {
            return Promise.reject(
                    new Error('current frame is already the first frame'));
        }
        else if (!frame.isComplete()) {
            return Promise.reject(
                    new Error('current frame is locked'));
        
        }
        
        this.frame = frame = frame.previous;
        
        if (arguments.length) {
            frame.load(data);
        }
        
        return frame.run();
    
    },
    
    play: function () {
        
    },
    
    stop: function () {
        var me = this;
        for (; me.frame;) {
            me.frame.destroy();
        }
        return this;
    },
    
    answer: function (desc, value) {
        var me = this,
            fields = me.fields,
            promptIds = me.fsm.prompts,
            prompts = me.prompts,
            hasOwn = Object.prototype.hasOwnProperty;
        var id;
        
        if (desc && typeof desc === 'string') {
            desc = ':' + desc;
            
            if (desc in promptIds) {
                id = promptIds[desc];

                if (hasOwn.call(prompts, id)) {
                    // remove answered prompts
                    fields.splice(fields.indexOf(id), 1);
                    delete prompts[id];
                    
                    me.event.emit('answer', id, value);
                    
                }
            }
        }
        return me;
    }
    
};


module.exports = Session;