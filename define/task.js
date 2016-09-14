"use strict";

var TASKS = {},
    EXPORTS = get;

function get(name) {
    var list = TASKS;
    var id;
    
    if (name && typeof name === 'string') {
        id = ':' + name;
        if (id in list) {
            return list[id];
        }
    }
    return false;
}

function register(name, task) {
    var list = TASKS;
    var id;
    
    if (!name || typeof name !== 'string') {
        throw new Error("Invalid task [name] parameter.");
    }
    
    if (!(task instanceof Function)) {
        throw new Error("Invalid [task] runner parameter.");
    }
    
    id = ':' + name;
    if (id in list) {
        throw new Error("Task [" + name + "] is already registered.");
    }
    
    list[id] = task;
    
    return EXPORTS;
}


module.exports = EXPORTS;
EXPORTS.define = register;