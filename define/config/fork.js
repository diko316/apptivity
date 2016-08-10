'use strict';

var ACTIVITY = require('../activity.js');

module.exports = [
    'fork',
    
    null,
    
    function (config) {
        
        var Definition = this.constructor,
            list = Array.prototype.slice.call(arguments, 1),
            l = list.length,
            c = -1,
            options = [],
            ol = 0,
            queue = config.queue,
            len = queue.length,
            notempty = len,
            action = ACTIVITY.create('fork', 'choice');
            
        var definition;
        
        action.options = options;
        config.last = action;
        
        for (; l--;) {
            definition = list[++c];
            if (!(definition instanceof Definition)) {
                throw new Error('invalid [definition] parameter');
            }
            
            options[ol++] = definition;
            
            // consecutive
            queue.push.apply(queue, definition.config.queue);
            len = queue.length;
            if (c) {
                queue[len++] = '|';
            }
            
        }
        
        queue[len++] = action.id;
        queue[len++] = '<';
        
        if (notempty) {
            queue[len++] = '.';
        }
        
        if (!c) {
            throw new Error("There is no defined condition to process");
        }
        
    }
];