'use strict';

var PROMISE = require('bluebird'),
    EventEmitter = require('eventemitter3'),
    IMMUTABLE = require('immutable'),
    //DEFINE = require('./define'),
    //FSM = require('./fsm.js'),
    Process = require('./session/process.js');

function createStateData(process) {
    var attached = process.immutableOutput;
    var activity;
        
    
    if (attached) {
        return attached;
    }
    
    activity = process.activity;
    
    process.immutableOutput = attached = IMMUTABLE.fromJS({
                                            state: process.from,
                                            action: activity.name,
                                            request: process.input,
                                            response: process.output
                                        });
    return attached;

}

function emitStartOrEnd(session, process, data) {
    var event = session.event;
    
    session.stateData = data;
    
    if (process.start) {
        event.emit('start', session, data);
    }
    
    event.emit('change', session, data);
    
    if (process.end) {
        event.emit('end', session, data);
    }
    
}




function Session(fsm) {
    this.event = new EventEmitter();
    this.fsm = fsm;
    this.destroyed = false;
}

Session.prototype = {
    
    context: null,
    event: void(0),
    fsm: void(0),
    process: null,
    destroyed: true,
    playing: false,
    
    stateData: null,
    
    constructor: Session,
    
    destroy: function () {
        var me = this;
        var event;
        if (!me.destroyed) {
            me.stop();
            delete me.destroyed;
            event = me.event;
            event.emit('destroy', me);
            event.removeAllListeners();
            
            delete me.event;
            delete me.playing;
            delete me.process;
            delete me.fsm;
        }
        return me;
    },
    
    info: function () {
        var process = this.process;
        
        return {
            
            playable: !this.destroyed,
            ended: process ?
                        process.end && process.completed : false,
            wait: process && process.waiting ?
                        process.activity.name : false,
                        
            current: process,
            next: process && process.next,
            previous: process && process.previous
            
        };
    },
    
    input: function (input) {
        var me = this,
            fsm = me.fsm,
            info = me.info();
        var state, process;
        
        if (!info.playable) {
            throw new Error('Session already destroyed');
        }
        
        if (info.current) {
            throw new Error('Session already has input');
        }
        
        state = fsm.start;
        me.process = process = new Process(me, state, fsm.lookup(state).target);
        process.input = input;
        return this;
    },
    
    getState: function () {
        var info = this.info(),
            process = info.current;
        
        if (process) {
            return process.immutableOutput;
        }
        return void(0);
    },
    
    previous: function () {
        var me = this,
            info = me.info(),
            Promise = PROMISE,
            create = createStateData,
            onChange = emitStartOrEnd;
            
        var process;
        
        if (!info.playable) {
            return Promise.reject(new Error('Session already destroyed'));
        }
        
        if (!info.current) {
            return Promise.reject(new Error('No process to play at this time'));
        }
        
        process = info.previous;
        
        if (process) {
            this.process = process;
            
            return process.run().
                        then(create).
                        then(function (state) {
                            onChange(me, process, state);
                            return state;
                        });
        }
        
        process = info.current;
        if (!process.completed) {
            return process.run().
                    then(function () {
                        return process.immutableOutput;
                    });
        }
        return Promise.resolve(process.immutableOutput);
        
    },
    
    next: function () {
        var me = this,
            info = me.info(),
            Promise = PROMISE,
            create = createStateData,
            onChange = emitStartOrEnd;
            
        var process;
        
        if (!info.playable) {
            return Promise.reject(new Error('Session already destroyed'));
        }
        
        if (!info.current) {
            return Promise.reject(new Error('No process to play at this time'));
        }
        
        process = info.next;
        
        if (process) {
            this.process = process;
            return process.run().
                        then(create).
                        then(function (state) {
                            onChange(me, process, state);
                            return state;
                        });
        }
        
        process = info.current;
        if (!process.completed) {
            return process.run().
                    then(function () {
                        return process.immutableOutput;
                    });
        }
        
        return Promise.resolve(process.immutableOutput);
        
    },
    
    play: function (context, input) {
        var me = this,
            Promise = PROMISE,
            info = me.info(),
            process = info.current;
        var runner;
        
        if (!me.destroyed) {
            
            if (info.ended) {
                me.reset();
            }
            else if (me.playing) {
                return Promise.reject(new Error("Session is still ongoing"));
            }
            else if (!process) {
                if (arguments.length > 1) {
                    me.input(input);
                }
                else {
                    me.input(null);
                }
            }
            
            process = me.process;
            
            if (process) {
                
                process.context = typeof context === 'undefined' ?
                                            null : context;
                
                me.event.emit('play-start', me);
                me.playing = true;
                
                runner = function (data) {
                    var scope = me,
                        process = scope.process;
                        
                    if (!process.end) {
                        return scope.next().then(runner);
                    }
                    else {
                        return PROMISE.resolve(data);
                    }
                };
                
                return process.run().
                            then(function (data) {
                                emitStartOrEnd(me,
                                    process,
                                    createStateData(process));
                                return data;
                            }).
                            then(runner).
                            then(function (data) {
                                delete me.playing;
                                me.event.emit('play-end', me, data, true);
                                return data;
                            }).
                            catch(function (e) {
                                delete me.playing;
                                me.event.emit('play-end', me, e, false);
                                return Promise.reject(e);
                            });
            
            }
            else {
                
                return Promise.reject(new Error("Session is unable to start"));
            
            }
            
        }
        
        return Promise.reject(new Error("Session is already destroyed"));
    
    },
    
    reset: function () {
        var me = this,
            info = me.info(),
            process = info.current;
        
        if (!info.playable) {
            throw new Error("Session is already destroyed");
        }
        
        if (!process) {
            throw new Error("Session did not start playing");
        }
        
        if (!info.ended) {
            throw new Error("Session did not end playing");
        }
        
        for (; process.origin; process = process.origin) {}
        
        this.process = process;
        delete me.stateData;
        emitStartOrEnd(me, process, null);

        return this;
    },
    
    stop: function () {
        var me = this;
        
        if (!me.destroyed) {
            for (; me.process;) {
                me.process.destroy();
            }
            delete me.stateData;
        }
        
        return me;
    
    },
    
    answer: function (input) {
        var info = this.info();
        if (info.wait) {
            info.current.answer(input);
        }
        return this;
    }
    
};


module.exports = Session;

