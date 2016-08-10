'use strict';

var ACTIVITY = require('../activity.js');

module.exports = [
    'condition',
    
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
            action = ACTIVITY.create('condition', 'choice');
            
        var definition;
        
        action.options = options;
        config.last = action;
        
        queue[len++] = action.id;
        
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
        
        
        queue[len++] = '[]';
        
        if (notempty) {
            queue[len++] = '.';
        }
        
        if (!c) {
            throw new Error("There is no defined condition to process");
        }
        
    }
];