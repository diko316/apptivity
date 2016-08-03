'use strict';

module.exports = [
    'action',
    
    function () {
        var config = this.config;
        
        config.actions = {};
        config.current = config.fsm.start;
        config.start = null;
        config.lastAction = null;
    },
    
    function (config, name) {
        var actions = config.actions,
            current = config.current,
            last = config.lastAction,
            fsm = config.fsm;
            
        var state, id;
        
        if (!name || typeof name !== 'string') {
            throw new Error('invalid [name] parameter');
        }

        id = current + ' > ' + name;
        if (last) {
            last.next = name;
        }
        else {
            config.start = name;
        }
        config.current = state = fsm.link(current, name);
        
        actions[id] = config.lastAction = {
            type: 'sequence',
            route: id,
            name: name,
            next: null
        };

    }
]; 