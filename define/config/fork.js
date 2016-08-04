'use strict';

var FORK_ID_GEN = 0;

module.exports = [
    
    'fork',
    
    null,
    
    function (config) {
        
        var Definition = this.constructor,
            list = Array.prototype.slice.call(arguments, 1),
            l = list.length,
            c = -1,
            options = null,
            lastOptions = null,
            last = config.end;
            
        var definition, action, option;
        
        for (; l--;) {
            definition = list[++c];
            if (!(definition instanceof Definition)) {
                throw new Error('invalid [definition] parameter');
            }
            
            option = {
                definition: definition,
                next: null
            };
            
            if (lastOptions) {
                lastOptions.next = option;
            }
            else {
                options = option;
            }
            
            lastOptions = option;
            
        }
        
        if (!options) {
            throw new Error("There is no defined process to fork");
        }
        
        config.end = action = {
            type: 'fork',
            name: 'fork' + (++FORK_ID_GEN),
            options: options,
            next: null
        };
        
        if (last) {
            last.next = action;
        }
        else {
            config.start = action;
        }

        
    }
];