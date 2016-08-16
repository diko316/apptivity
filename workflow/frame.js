'use strict';

var STATUS_UNINITIALIZED = 0,
    PROCESS = require('./process.js'),
    PROMISE = require('bluebird');

function Frame(session) {
    this.session = session;
    this.processes = {};
    this.request = {};
}

Frame.prototype = {
    
    STATUS_UNINITIALIZED: STATUS_UNINITIALIZED,
    STATUS_READY: 1,
    STATUS_PROCESSING: 2,
    STATUS_PROMPT: 3,
    STATUS_COMPLETE: 4,
    
    status: STATUS_UNINITIALIZED,
    error: false,
    end: false,
    
    session: void(0),
    processes: void(0),
    request: void(0),
    response: null,
    data: null,
    mergers: null,
    previous: null,
    next: null,
    constructor: Frame,
    
    allowRun: function () {
        return this.status === this.STATUS_READY;
    },
    
    allowNext: function () {
        return this.status === this.STATUS_COMPLETE && !this.error;
    },
    
    load: function (data) {
        var hasOwn = Object.prototype.hasOwnProperty,
            processes = this.processes;
        var name;
        
        for (name in data) {
            if (hasOwn.call(data, name) &&
                hasOwn.call(processes, name)) {
                this.set(name, data[name]);
            }
        }
        return this;
    },
    
    set: function (state, data) {
        
        var fsm = this.session.fsm,
            processes = this.processes,
            request = this.request,
            direction = fsm.lookup(state);
        
        if (direction) {
            // create process
            if (!Object.prototype.hasOwnProperty.call(processes, state)) {
                processes[state] = new PROCESS(this, state);
            }
            
            processes[state].request = request[state] = data;
            
            
            if (this.status === this.STATUS_UNINITIALIZED) {
                this.status = this.STATUS_READY;
            }
            
        }
        return this;
    },
    
    
    run: function () {
        var Promise = PROMISE,
            me = this,
            processes = me.processes,
            session = me.session,
            fsm = session.fsm;
            
        var state, process, hasOwn, direction, promises, pl, callback;
        
        if (!me.allowRun()) {
            return Promise.reject('Unable to run');
        }
        
        me.status = me.STATUS_PROCESSING;
        
        hasOwn = Object.prototype.hasOwnProperty;
        promises = [];
        pl = 0;
        
        callback = function (state, target, data) {
            var process = me.processes[state];
            return session.exec(state, target, data).
                        then(function (data) {
                            return {
                                process: process,
                                response: data
                            };
                        });
        };
        
        // run process
        for (state in processes) {
            if (!hasOwn.call(processes, state)) {
                continue;
            }
            process = processes[state];
            
            direction = fsm.lookup(state);
            switch (direction.type) {
            case 'link':
                promises[pl++] = callback(state,
                                        direction.target,
                                        process.request);
                
            }
            //session
            
        }
        
        return Promise.all(promises).
                then(function (list) {
                    var c = -1,
                        l = list.length;
                    var item;
                    
                    me.response = {};
                    me.data = {};
                    
                    for (; l--;) {
                        item = list[++c];
                        me.saveResponse(item.process, item.response);
                    }
                    
                    me.status = me.STATUS_COMPLETE;
                    return me.data;
                }).
                catch(function (error) {
                    me.status = me.STATUS_COMPLETE;
                    return Promise.reject(
                            me.error = error = error instanceof Error ?
                                                    error : new Error(error));
                });
        
    },
    
    
    input: function () {
        
    },
    
    addMerger: function (id, options, state) {
        var list = this.mergers;
        if (!list) {
            this.mergers = list = {};
        }
        list[id] = {
            id: id,
            complete: false,
            state: state,
            options: options.slice(0),
            data: {}
        };
        return this;
    },
    
    removeMerger: function (id, action, data) {
        var list = this.mergers;
        var item, options, index;
        
        if (id in list) {
            item = list[id];
            if (!item.complete) {
                options = item.options;
                index = options.indexOf(action);
                if (index !== -1) {
                    options.splice(index, 1);
                    item.data[
                        action.substring(1, action.length)
                    ] = data;
                    if (!options.length) {
                        item.complete = true;
                        this.response[item.state] = item.data;
                        //console.log('completed! ', item);
                    }
                }
                
            }
        }
        return this;
    },
    
    createNext: function (override) {
        var me = this,
            response = this.response;
        var frame, state, hasOwn;
        
        if (me.status === me.STATUS_COMPLETE && !me.error) {
            
            if (!arguments.length) {
                override = this.response;
            }
            
            
            frame = new Frame(me.session);
            this.next = frame;
            frame.previous = this;
            frame.mergers = this.mergers;
            
            //console.log('loaded? ', override);
            
            // load
            hasOwn = Object.prototype.hasOwnProperty;
            for (state in response) {
                if (hasOwn.call(response, state)) {
                    frame.set(state, null);
                }
            }

            frame.load(override);
            
            return frame;
            
            
        }
        
    },
    
    saveResponse: function (process, data) {
        var saved = this.response,
            myData = this.data,
            merges = this.session.fsm.merges,
            activity = data.activity,
            joints = [],
            jl = 0;
        var state, name, item, list, hasOwn, joint, merge, id;
        
        joints[jl++] = {
            id: data.from + ' > ' + activity.desc,
            data: data.response
        };
            
        switch (activity.type) {
        case 'action':
            // create next process
            state = data.from;
            process.response = myData[state] = data;
            saved[data.to] = data.response;
            
            break;
        case 'condition':
            
            //console.log('condition! ', data.from, ':' , activity.desc,' > ', data.to);
            
            break;
        case 'fork':
            //console.log('fork! ', data.from, ':' , activity.desc,' > ', data.to);
            
            state = data.from;
            process.response = myData[state] = data;
            
            
            this.addMerger(data.process, data.options, data.processState);
            
            hasOwn = Object.prototype.hasOwnProperty;
            list = data.response;
            for (name in list) {
                if (hasOwn.call(list, name)) {
                    item = list[name];
                    saved[item.to] = item.response;
                    joints[jl++] = {
                        id: item.from + ' > ' + item.activity.desc,
                        data: item.response
                    };
                }
            }
            
            break;
        case 'end':
            this.end = true;
            //console.log('ended! ', data.from, ':' , activity.desc,' > ', data.to);
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
        
        //console.log(state, ' = ', data);
    }
};

module.exports = Frame;
