'use strict';

var STATUS_UNINITIALIZED = 0,
    PROCESS = require('./process.js'),
    PROMISE = require('bluebird');
    
    
function convertOutput(data) {
    var options = data.options;
    var c, l, name, newData, hasOwn;
    
    if (options) {
        hasOwn = Object.prototype.hasOwnProperty;
        newData = {};
        data = data.response;
        for (c = -1, l = options.length; l--;) {
            name = options[++c];
            name = name.substring(1, name.length);
            newData[name] = hasOwn.call(data, name) ?
                                    data[name].response : void(0);
        }
        return newData;
    }
    return data.response;
}

function Frame(session) {
    this.session = session;
    this.processes = {};
    this.request = {};
    this.destroyed = false;
}

Frame.prototype = {
    
    STATUS_UNINITIALIZED: STATUS_UNINITIALIZED,
    STATUS_READY: 1,
    STATUS_PROCESSING: 2,
    STATUS_PROMPT: 3,
    STATUS_COMPLETE: 4,
    
    status: STATUS_UNINITIALIZED,
    error: false,
    lastError: void(0),
    start: false,
    end: false,
    destroyed: true,
    
    session: void(0),
    processes: void(0),
    request: void(0),
    response: null,
    data: null,
    mergers: null,
    previous: null,
    next: null,
    constructor: Frame,
    
    isComplete: function () {
        return this.status === this.STATUS_COMPLETE;
    },
    
    allowRun: function () {
        var me = this,
            status = me.status;
        return !me.destoyed &&
                (status === me.STATUS_READY || status === me.STATUS_COMPLETE);
    },
    
    allowNext: function () {
        var me = this;
        return !me.destroyed &&
                    (me.status === me.STATUS_COMPLETE && !me.error);
    },
    
    load: function (data, rerun) {
        var me = this,
            hasOwn = Object.prototype.hasOwnProperty,
            processes = me.processes;
        var name;
        
        if (me.destroyed) {
            return me;
        }
        
        for (name in data) {
            if (hasOwn.call(data, name) &&
                hasOwn.call(processes, name)) {
                this.set(name, data[name]);
            }
        }
        
        if (rerun === true && me.status === me.STATUS_COMPLETE) {
            me.state = me.STATUS_READY;
        }
        return me;
    },
    
    set: function (state, data) {
        
        var me = this,
            fsm = !me.destroyed && me.session.fsm,
            processes = me.processes,
            request = me.request,
            direction = fsm && fsm.lookup(state);
        
        if (direction) {
            // create process
            if (!Object.prototype.hasOwnProperty.call(processes, state)) {
                processes[state] = new PROCESS(me, state);
            }
            
            processes[state].request = request[state] = data;
            
            
            if (me.status === me.STATUS_UNINITIALIZED) {
                me.status = me.STATUS_READY;
            }
            
        }
        return me;
    },
    
    destroy: function () {
        var me = this,
            session = me.session,
            previous = me.previous,
            next = me.next;
        var hasOwn, name;
        
        if (!me.destroyed) {
            delete me.destroyed;
            hasOwn = Object.prototype.hasOwnProperty;
            
            if (session.frame === me) {
                session.frame = previous || next;
            }
            
            if (previous) {
                previous.next = next;
            }
            
            if (next) {
                next.previous = previous;
            }
            
            for (name in me) {
                if (hasOwn.call(me, name)) {
                    me[name] = null;
                    delete me[name];
                }
            }
            
            session.event.emit('frame-destroyed', session, me);
        }
        session = null;
        me = null;
        return me;
    },
    
    run: function () {
        var Promise = PROMISE,
            me = this,
            processes = me.processes,
            session = me.session,
            fsm = session && session.fsm;
            
        var state, process, hasOwn, direction, promises, pl, callback, error;
        
        if (me.destroyed) {
            return Promise.reject('Cannot Run Dead frame');
        }
        
        if (me.start) {
            session.event.emit('start', session);
        }
        
        session.event.emit('before-run', session, me.data);
        
        // rerun data and error if complete
        if (me.status === me.STATUS_COMPLETE) {
            error = me.error;
            session.event.emit('run', session, me.data, !error);
            
            if (me.end) {
                session.event.emit('end', session);
            }
            return error ?
                        Promise.reject(me.error) : Promise.resolve(me.data);
        }
        
        if (!me.allowRun()) {
            return Promise.reject('Unable to run at this state');
        }
        
        me.status = me.STATUS_PROCESSING;
        
        hasOwn = Object.prototype.hasOwnProperty;
        promises = [];
        pl = 0;
        
        callback = function (state, target, data) {
            var process = me.processes[state],
                name = target.substring(1, target.length);
                
            session.event.emit('before-process', session, name, data);
            
            return session.exec(state, target, data).
                        then(function (response) {
                            if (!session.destroyed) {
                                session.event.emit('process',
                                                    session,
                                                    name,
                                                    data,
                                                    convertOutput(response),
                                                    true);
                            }
                            return {
                                process: process,
                                response: response
                            };
                        }).
                        catch(function (error) {
                            if (!session.destroyed) {
                                session.event.emit('process',
                                                    session,
                                                    name,
                                                    data,
                                                    void(0),
                                                    false);
                            }
                            return Promise.reject(error);
                        });
        };
        
        // run process
        for (state in processes) {
            if (!hasOwn.call(processes, state)) {
                continue;
            }
            process = processes[state];
            
            direction = fsm.lookup(state);
            if (direction.type === 'link') {
                promises[pl++] = callback(state,
                                        direction.target,
                                        process.request);
                
            }
            
        }
        
        return Promise.all(promises).
                then(function (list) {
                    var c = -1,
                        l = list.length;
                    var item;
                    
                    if (me.destroyed) {
                        return Promise.reject(
                                'Stopped all running process');
                    }
                    
                    me.response = {};
                    me.data = {};
                    
                    for (; l--;) {
                        item = list[++c];
                        me.saveResponse(item.process, item.response);
                    }
                    
                    me.status = me.STATUS_COMPLETE;
                    
                    session.event.emit('run', session, me.data, true);
                    
                    if (me.end) {
                        session.event.emit('end', session);
                    }

                    return me.data;
                
                }).
                catch(function (error) {
                    var destroyed = session.destroyed;
                    
                    error = error instanceof Error ?
                                error : new Error(error);
                    me.status = me.STATUS_COMPLETE;
                    if (!destroyed) {
                        session.event.emit('run', session, me.data, false);
                    }
                    me.error = true;
                    me.lastError = error;
                    if (me.end && !destroyed) {
                        session.event.emit('end', session);
                    }
                    return Promise.reject(error);
                });
        
    },
    
    // TODO: merger must be a stack linked list
    addMerger: function (id, options, state) {
        var list = this.mergers;
        if (!list) {
            this.mergers = list = {};
        }
        list[id] = {
            id: id,
            complete: false,
            frameEnd: null,
            state: state,
            options: options.slice(0),
            data: {}
        };
        return this;
    },
    
    // TODO: merger must be a stack linked list
    removeMerger: function (id, action, data) {
        var list = this.mergers,
            myData = this.data;
        var item, options, index, state;
        
        if (id in list) {
            item = list[id];
            state = item.state;
            
            // remove data from response
            if (state in myData) {
                delete myData[state];
            }
            
            if (!item.complete) {
                options = item.options;
                index = options.indexOf(action);
                if (index !== -1) {
                    
                    options.splice(index, 1);
                    
                    // add to data
                    item.data[
                        action.substring(1, action.length)
                    ] = data;
                    
                    // merger has completed
                    if (!options.length) {
                        item.complete = true;
                        item.frameEnd = this;
                        myData[state] = item.data;
                    }
                }
            }
            // from rerun
            else if (item.frameEnd === this) {
                myData[state] = item.data;
            }
            
        }
        return this;
    },
    
    createNext: function (override) {
        var me = this,
            data = this.data;
        var frame, state, hasOwn;
        
        if (me.allowNext()) {
            
            if (!arguments.length) {
                override = this.data;
            }
            
            frame = new Frame(me.session);
            this.next = frame;
            frame.previous = this;
            frame.mergers = this.mergers;
            
            // load
            hasOwn = Object.prototype.hasOwnProperty;
            for (state in data) {
                if (hasOwn.call(data, state)) {
                    frame.set(state, null);
                }
            }

            frame.load(override);
            
            return frame;

        }
        
        return void(0);
        
    },
    
    saveResponse: function (process, data) {
        var response = this.response,
            myData = this.data,
            merges = !this.destroyed && this.session.fsm.merges,
            activity = data.activity,
            joints = [],
            jl = 0;
        var state, name, item, list, hasOwn, joint, merge, id;
        
        joints[jl++] = {
            id: data.from + ' > ' + activity.desc,
            data: data.response
        };
            
        switch (activity.type) {
        
        case 'end':
            this.end = true;
            
        /* falls through */
        case 'action':
        case 'input':
            state = data.from;
            process.response = response[state] = data;
            myData[data.to] = data.response;
            break;

        case 'fork':

            state = data.from;
            process.response = response[state] = data;

            
            this.addMerger(data.process, data.options, data.processState);
            
            hasOwn = Object.prototype.hasOwnProperty;
            list = data.response;

            for (name in list) {
                if (hasOwn.call(list, name)) {
                    item = list[name];
                    myData[item.to] = item.response;
                    joints[jl++] = {
                        id: item.from + ' > ' + item.activity.desc,
                        data: item.response
                    };
                }
            }
            break;
        }
        
        
        for (; jl--;) {
            joint = joints[jl];
            id = joint.id;
            if (id in merges) {
                merge = merges[id];
                this.removeMerger(merge.pid, merge.target, joint.data);
            }
        }

    }
};

module.exports = Frame;
