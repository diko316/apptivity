'use strict';

var GUARD_ID_GEN = 0,
    FUNCTION_TO_NAME = /^function ([^\(]+)\(/;


module.exports = [
    'guard',
    
    null,
    
    function (config, name, handler) {
        var current = config.last;
        var m;
        
        if (!current) {
            throw new Error('no activity to guard');
        }
        
        if (current.guard) {
            throw new Error(
                    'activity [' + current.name + '] already has guard');
        }
        
        if (name instanceof Function) {
            handler = name;
            m = name.match(FUNCTION_TO_NAME.toString());
            name = m ? m[1] : 'guard' + (++GUARD_ID_GEN);
        }
        
        if (!(handler instanceof Function)) {
            throw new Error('invalid [handler] parameter');
        }
        
        current.guard = handler;
        current.guardName = name;
    }];