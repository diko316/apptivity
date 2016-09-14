'use strict';

var TASK = require('../task.js'),
    GUARD_ID_GEN = 0,
    FUNCTION_TO_NAME = /^function ([^\(]+)\(/;


module.exports = [
    'guard',
    
    null,
    
    function (config, name, handler) {
        var current = config.last;
        var m, handlerName;
        
        if (!current) {
            throw new Error('no activity to guard');
        }
        
        if (current.guard) {
            throw new Error(
                    'activity [' + current.name + '] already has guard');
        }
        
        if (name && typeof name === "string") {
            handler = name;
        }
        else if (name instanceof Function) {
            handler = name;
            m = name.toString().match(FUNCTION_TO_NAME.toString());
            name = m ? m[1] : 'guard' + (++GUARD_ID_GEN);
        }
        
        if (handler && typeof handler === 'string') {
            handlerName = handler;
            name = '[' + handler + ']';
            handler = function (data) {
                var fn = TASK(handlerName);
                
                if (fn) {
                    return fn.apply(this, arguments);
                }
                console.warn("guard for [" + current.name +
                            "] activity named " + handlerName +
                            " is not yet implemented.");
                return data;
            };
        }
        else if (!(handler instanceof Function)) {
            throw new Error('invalid [handler] parameter');
        }
        
        current.guard = handler;
        current.guardName = name;
    }];