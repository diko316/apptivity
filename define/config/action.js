'use strict';

module.exports = [
    'action',
    
    function () {
        var config = this.config;
        
        config.actions = {};
        config.start = null;
        config.end = null;
        config.current = null;
    },
    
    function (config, name) {
        var actions = config.actions,
            current = config.current;
        var id;
        
        if (!name || typeof name !== 'string') {
            throw new Error('invalid [name] parameter');
        }
        
        id = ':' + name;
        if (id in actions) {
            throw new Error('action [' + name + '] already exist');
        }
        
        // concatenate
        if (current) {
            current.next = id;
        }
        // create start action
        else {
            config.start = id;
        }
        
        config.end = id;
        
        config.current = actions[id] = {
            type: 'action',
            name: name,
            next: null
        };
    }
];