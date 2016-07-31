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
            entries = [],
            el = 0,
            actions = config.actions,
            current = config.current;
            
        var definition, id;
        
        for (; l--;) {
            definition = list[++c];
            if (!(definition instanceof Definition)) {
                throw new Error('invalid [definition] parameter');
            }
            entries[el++] = definition;
        }
        
        id = 'forked' + (++FORK_ID_GEN);
        
        // concatenate
        if (current) {
            current.next = id;
        }
        // create start action
        else {
            config.start = id;
        }
        
        config.end = id;
        
        actions[id] = config.current = {
            type: 'fork',
            name: id,
            next: null
        };
        
        
    }
];