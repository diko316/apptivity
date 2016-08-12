'use strict';

var PROMISE = require('bluebird'),
    BUS = require('interesting')(),
    STATUS_UNINITIALIZED = 0,
    STATUS_PROCESSING = 1,
    STATUS_SUCCESS = 2,
    STATUS_FAIL = 3,
    STATUS_CANCELLED = 4,
    EXPORTS = create;
var BASE_INSTANCE;
    
    
function create() {
    var instance = createUninitialized(false);
    
    instance.status = STATUS_UNINITIALIZED;
    
    return instance.constructor.apply(instance, arguments);
}

function createUninitialized(base) {
    var E = empty;
    E.prototype = base instanceof Processor ? base : BASE_INSTANCE;
    return new E();
}

function publish(name, processor) {
    var bus = BUS;
    
    if (name && typeof name === 'string' &&
        processor instanceof Processor) {
        bus.publish.apply(bus, arguments);
    }
    
    return EXPORTS;
}

function subscribe() {
    var bus = BUS;
    return bus.subscribe.apply(bus, arguments);
}


function empty() {
    
}

function defaultRunCallback(data) {
    return data;
}


function Processor(data, runCallback) {
    
    var me = this,
        eventbus = BUS;
   
    me.request = data;
    
    PROMISE.resolve(data).
    
        then(function (data) {
                if (!me.killed && me.status !== STATUS_CANCELLED) {
                    me.status = me.STATUS_PROCESSING;
                    eventbus.publish('initialize', me, data);
                    return data;
                }
                return PROMISE.reject(null);
            }).
        
        then(function (data) {
            var runner = runCallback instanceof Function ?
                            runCallback : defaultRunCallback;
            if (!me.killed && me.status !== STATUS_CANCELLED) {
                return runner(data);
            }
            return PROMISE.reject(null);
        }).
        
        then(function (data) {
                if (!me.killed && me.status !== STATUS_CANCELLED) {
                    me.data = data;
                    me.status = me.STATUS_SUCCESS;
                    eventbus.publish('success', me, data);
                    eventbus.publish('complete', me, data);
                }
            },
            function () {
                if (!me.killed && me.status !== STATUS_CANCELLED) {
                    me.status = me.STATUS_FAIL;
                    eventbus.publish('fail', me);
                    eventbus.publish('complete', me);
                }
            });
        
    return me;
}

Processor.prototype = {
    
    STATUS_UNINITIALIZED: STATUS_UNINITIALIZED,
    STATUS_PROCESSING: STATUS_PROCESSING,
    STATUS_SUCCESS: STATUS_SUCCESS,
    STATUS_FAIL: STATUS_FAIL,
    STATUS_CANCELLED: STATUS_CANCELLED,
    
    killed: false,
    status: STATUS_UNINITIALIZED,
    data: void(0),
    request: void(0),
    parent: null,
    children: null,
    next: null,
    previous: null,
    
    constructor: Processor,
    
    processing: function () {
        var me = this,
            status = me.status;
            
        return status === me.STATUS_UNINITIALIZED ||
                status === me.STATUS_PROCESSING;
    },
    
    spawn: function (data, runCallback) {
        var me = this;
        
        var instance, currentChild;
        
        if (me.killed) {
            throw new Error('Process is already killed');
        }
        
        instance = createUninitialized(me);
        currentChild = me.children;
        
        // initialize
        instance.status = me.STATUS_UNINITIALIZED;
        instance.parent = me;
        instance.children = null;
        
        // create heirarchy
        if (currentChild) {
            for (; currentChild.next; currentChild = currentChild.next) {}
            currentChild.next = instance;
            instance.previous = currentChild;
        }
        else {
            me.children = currentChild = instance;
        }
        
        return instance.constructor.call(instance, data, runCallback);
    },
    
    kill: function () {
        
        var me = this,
            child = me.children,
            after = child;
        var before, parent;
        
        if (!me.killed) {
            
            // kill chilren
            for (; after; after = after.next) {
                after.kill();
            }
            
            me.cancel();
            BUS.publish('before-kill', me);
            
            // disjoint
            parent = me.parent;
            before = me.previous;
            after = me.next;
            
            if (before) {
                before.next = after;
            }
            me.previous = null;
            
            if (after) {
                after.previous = before;
            }
            me.next = null;
            
            if (parent && parent.children === me) {
                parent.children = before || after;
            }
            me.parent = null;
            
            me.killed = true;
        }
        
        return me;
    },
    
    cancel: function () {
        var me = this,
            CANCELLED = me.STATUS_CANCELLED;
        if (!me.killed && me.status === me.STATUS_PROCESSING) {
            me.status = CANCELLED;
            BUS.publish('cancel', me);
        }
        return me;
    }
};

empty.prototype = Processor.prototype;
BASE_INSTANCE = new empty();

module.exports = EXPORTS;
EXPORTS.subscribe = subscribe;
EXPORTS.publish = publish;

EXPORTS.STATUS_UNINITIALIZED = STATUS_UNINITIALIZED;
EXPORTS.STATUS_PROCESSING = STATUS_PROCESSING;
EXPORTS.STATUS_SUCCESS = STATUS_SUCCESS;
EXPORTS.STATUS_FAIL = STATUS_FAIL;
EXPORTS.STATUS_CANCELLED = STATUS_CANCELLED;
