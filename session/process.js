'use strict';

var PROMISE = require('bluebird'),
    EventEmitter = require('eventemitter3');
    
function EMPTY() {
    
}

function runGuard(activity, input) {
    var guard = activity.guard,
        Promise = PROMISE;
    
    if (guard) {
        return Promise.resolve(input).
                then(guard).
                then(function () {
                    return activity;
                });
    }
    return Promise.resolve(activity);
}


function Process(session, state, action) {
    var fsm = session.fsm,
        info = fsm.info(state, action),
        activity = info.activity;
    
    this.session = session;
    this.destroyed = false;
    
    this.from = state;
    this.to = {};
    this.activity = activity;
    this.info = info;
    
    this.event = new EventEmitter();
    
    if (state === fsm.start) {
        this.start = true;
    }
    
    if (activity.type === 'end') {
        this.end = true;
    }
    //this.to = info.state;
    //console.log(info);
}

Process.prototype = {
    
    session: void(0),
    activity: void(0),
    from: void(0),
    to: void(0),
    
    input: void(0),
    output: void(0),
    immutableOutput: void(0),
    
    origin: null,
    previous: null,
    next: null,
    
    start: false,
    end: false,
    
    info: null,
    stopAndMerge: null,
    running: false,
    failedMessage: void(0),
    failed: false,
    completed: false,
    destroyed: true,
    
    event: void(0),
    waiting: false,
    
    constructor: Process,
    
    destroy: function () {
        var me = this,
            session = me.session;
        var others, next, previous, waiting;
        
        if (!me.destroyed) {
            delete me.destroyed;
            me.event.emit('destroy', me);
            
            // remove if waiting
            waiting = me.waiting;
            if (waiting) {
                clearInterval(waiting);
                delete me.waiting;
            }
            
            // remove listeners
            me.event.removeAllListeners();
            
            // destroy others originating from me
            for (others = me.next; others; others = others.next) {
                if (others.origin === me) {
                    others.destroy();
                }
            }
            
            // unlink myself from process
            next = me.next;
            previous = me.previous;
            
            if (previous) {
                previous.next = next;
            }
            
            if (next) {
                next.previous = previous;
            }
            
            if (session.process === me) {
                session.process = next || previous;
            }
            
            delete me.next;
            delete me.previous;
            delete me.origin;
            delete me.to;
            
            // delete unset all
            delete me.event;
            delete me.activity;
            delete me.info;
            delete me.stopAndMerge;
            delete me.session;
            delete me.immutableOutput;
        }
        return this;
    },

    run: function (input) {
        var me = this,
            activity = me.activity,
            Promise = PROMISE;
        var origin;
        
        if (me.destroyed) {
            return Promise.reject(new Error("Process is already destroyed"));
        }
        
        if (me.end) {
            
            if (arguments.length) {
                me.input = input;
            }
            else {
                input = me.input;
            }
            
            me.completed = true;
            me.output = input;
        }
        
        if (me.completed) {
            
            return me.failed ?
                        Promise.reject(me.failedMessage) :
                        Promise.resolve(me);
        
        }
        else if (me.running) {
            
            return new Promise(function (resolve, reject) {
                me.event.once('process-complete',
                    function (me, success) {
                        if (success) {
                            resolve(me);
                        }
                        else {
                            reject(me.failedMessage);
                        }
                    });
            });
        
        }
        else {
            
            me.running = true;
            origin = me.origin;
            
            if (arguments.length) {
                me.input = input;
            }
            else {
                input = me.input;
            }
            
            me.notify('process-start', [input]);
            
            // guard the link
            return (me.session.fsm.lookup(me.from).type === 'condition' ?
                Promise.resolve(activity) : runGuard(activity, input)).
            
                then(function (activity) {
                    if (me.destroyed) {
                        return Promise.reject("Process is already destroyed");
                    }
                    return me.createNext(activity, input);
                }).
                
                then(function (found) {
                    var last = me,
                        firstFound = found,
                        stopAndMerge = me.stopAndMerge,
                        current = null;
                    
                    if (me.destroyed) {
                        return Promise.reject("Process is already destroyed");
                    }
                    
                    for (; last.next; last = last.next) {}

                    // merge process
                    if (stopAndMerge) {
                        for (; found; found = found.next) {
                            
                            current = me.createMergeProcess(
                                                found,
                                                stopAndMerge);
                            
                            if (!current) {
                                continue;
                            }

                            current.previous = last;
                            last = last.next = current;
                            
                        }
                    }
                    // normal process
                    else {
                        for (; found; found = found.next) {
                            current = me.createProcessFromResult(found);
                            current.previous = last;
                            last = last.next = current;
                        }
                        
                    }
                    
                    // save output
                    if (current) {
                        me.output = current.input;
                    }
                    else if (firstFound) {
                        me.output = firstFound.output;
                    }
                    
                    delete me.running;
                    me.completed = true;
                    me.notify('process-complete', [me, true]);
                    return me;
                    
                }).
                catch(function (e) {
                    me.failedMessage = e instanceof Error ?
                                                e : new Error(e);
                    me.failed = true;
                    me.completed = true;
                    delete me.running;
                    delete me.output;
                    
                    me.notify('process-complete', [me, false]);
                    return Promise.reject(me.failedMessage);
                });
        }
    },
    
    answer: function (input) {
        
        if (this.waiting) {
            
            this.event.emit('process-answer', this, input);
        
        }
        
        return this;
    },
    
    notify: function (eventName, args) {
        var session = this.session;
        var event;
        
        if (session) {
            
            event = this.event;
            event.emit.apply(event,
                [eventName, this].concat(args)
            );
            
            event = session.event;
            event.emit.apply(event,
                [eventName, session].concat(args)
            );
        }
        
        return this;
    },

    
    createNext: function (activity, input) {
        var me = this,
            Promise = PROMISE,
            handler = activity.handler,
            fsm = me.session.fsm,
            info = me.info,
            target = info.state,
            type = activity.type;
        var promise, lookup, options, c, l, first, response, last, subinfo;
        
        switch (type) {
        case 'input':
        case 'action':
            
            lookup = this.session.fsm.lookup(info.state);
            
            if (type === 'input') {
                promise = new Promise(function (resolve, reject) {
                            var event = me.event;
                            
                            function onDestroy() {
                                clearInterval(me.waiting);
                                event.removeListener(
                                        'process-answer', onAnswer);
                                delete me.waiting;
                                
                                reject('Process already destroyed');
                            }
                            
                            function onAnswer(me, newInput) {
                                clearInterval(me.waiting);
                                event.removeListener('destroy', onDestroy);
                                delete me.waiting;
                                
                                if (me.destroyed) {
                                    reject('Process already destroyed');
                                }
                                else {
                                    resolve(newInput);
                                }
                            }
                            
                            // listen to answers
                            event.once('process-answer', onAnswer);
                            event.once('destroy', onDestroy);
                            
                            me.waiting = setInterval(EMPTY, 10);
                            
                            me.notify('process-prompt', [
                                            me.activity.name,
                                            input]);
                            
                        });
            }
            else {
                promise = Promise.resolve(input);
            }
            
            if (handler) {
                promise = promise.then(handler);
            }
            
            return promise.
                        then(function (output) {
                            return {
                                state: target,
                                activity: lookup.target,
                                merge: info.merge,
                                output: output,
                                next: null
                            };
                            
                        });
        
        case 'condition':
            
            return (new Promise(function (resolve, reject) {
                var state = target,
                    options = info.options,
                    c = -1,
                    l = options.length,
                    total = l,
                    FSM = fsm,
                    run = runGuard,
                    subinput = input,
                    fallback = null,
                    activity = null;
                var subinfo;
                
                function callback(activity) {
                    resolve(activity);
                }
                
                function catcher() {
                    if (!--total) {
                        if (fallback) {
                            resolve(fallback);
                        }
                        else {
                            reject(new Error("No condition met"));
                        }
                    }
                }
                
                for (; l--;) {
                    subinfo = FSM.info(state, options[++c]);
                    activity = subinfo.activity;
                    if (!activity.guard) {
                        fallback = activity;
                        total--;
                        continue;
                    }
                    run(activity, subinput).
                        then(callback).
                        catch(catcher);
                }
                
            })).
                then(function (activity) {
                    return {
                        state: info.state,
                        activity: activity.desc,
                        merge: info.merge,
                        output: input,
                        next: null
                    };
                });
                
        case 'fork':
            options = info.options;
            first = last = null;
            me.createMerger();
            
            for (c = -1, l = options.length; l--;) {
                subinfo = fsm.info(target, options[++c]);
                response = {
                    state: target,
                    activity: subinfo.activity.desc,
                    merge: subinfo.merge,
                    output: input,
                    next: null
                };
                if (!first) {
                    first = response;
                }
                else {
                    last.next = response;
                }
                last = response;
                
            }
            return Promise.resolve(first);
        }
    },
    
    createMergeProcess: function (found, stopAndMerge) {
        var me = this,
            merger = me.merger,
            output = found.output,
            state = found.state,
            completedMerger = null;
            
        var pid, action, data, pending, process;
        
        for (; merger; merger = merger.before) {
            pid = merger.id;
            if (pid in stopAndMerge && state === merger.state) {
                action = stopAndMerge[pid];
                pending = merger.pending;
                
                // apply
                if (action in pending && pending[action]) {
                    pending[action] = false;
                    data = merger.data;
                    data[
                        action.substring(1, action.length)
                    ] = output;
                    
                    // completed!
                    if (!--merger.total) {
                        completedMerger = merger;
                        output = data;
                        continue;
                    }
                    
                }
            }
            break;
        }
        
        
        if (completedMerger) {
            process = new Process(me.session,
                            found.state,
                            found.activity);
            
            process.merger = completedMerger.before;
            process.input = output;
            process.origin = me;
            
            me.to[found.activity] = process;
            
            return process;
        
        }
        
        return void(0);
        
    },
    
    createProcessFromResult: function (found) {
        var me = this,
            merger = me.merger,
            merge = found.merge,
            process = new Process(me.session,
                            found.state,
                            found.activity);
        var pid, pending, stopAndMerge, action;
        
        process.merger = merger;
        process.input = found.output;
        process.origin = me;
        me.to[found.activity] = process;

        
        // check if this is the last process
        if (merge) {
            
            stopAndMerge = null;
            
            for (; merger; merger = merger.before) {
                pid = merger.id;
                pending = merger.pending;
                
                
                if (pid in merge) {
                    action = merge[pid];
                    
                    if (action in pending && pending[action]) {
                        
                        if (!stopAndMerge) {
                            stopAndMerge = {};
                        }
                        
                        stopAndMerge[pid] = action;
                        
                    }
                }
                
            }
            
            if (stopAndMerge) {
                process.stopAndMerge = stopAndMerge;
            }
        }
        
        return process;
    },
    
    createMerger: function () {
        var info = this.info;
        var target, options, c, l, total, pending;
        
        if (info.activity.type === 'fork') {
            target = info.prcessState;
            options = info.options;
            pending = {};
            
            for (c = -1, l = total = options.length; l--;) {
                pending[options[++c]] = true;
            }

            this.merger = {
                state: info.processState,
                id: info.process,
                total: total,
                pending: pending,
                data: {},
                before: this.merger
            };

        }
    }
};


module.exports = Process;