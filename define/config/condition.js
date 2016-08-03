'use strict';

var CONDITION_ID_GEN = 0;

module.exports = [
    'condition',
    
    null,
    
    function (config) {
        
        var Definition = this.constructor,
            list = Array.prototype.slice.call(arguments, 1),
            l = list.length,
            c = -1,
            choices = [],
            actions = config.actions,
            current = config.current,
            last = config.lastAction,
            fsm = config.fsm,
            state = null;
            
        var definition, id, name;
        
        for (; l--;) {
            definition = list[++c];
            if (!(definition instanceof Definition)) {
                throw new Error('invalid [definition] parameter');
            }
            choices[c] = definition.finalize();
            name = definition.config.name;
            
            // link
            if (state) {
                fsm.link(current, name, state);
            }
            else {
                state = fsm.link(current, name);
            }
            
        }
        
        if (!state) {
            throw new Error("There is no defined condition to process");
        }
        
        config.current = state;
        name = 'condition' + (++CONDITION_ID_GEN);
        if (last) {
            last.next = name;
        }
        else {
            config.start = name;
        }
        id = current + ' > ' + name;
        
        actions[id] = config.lastAction = {
            type: 'choice',
            route: id,
            name: name,
            options: choices,
            next: null
        };
        
    }
];