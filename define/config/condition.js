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
            options = null,
            lastOptions = null,
            last = config.end,
            action = ACTIVITY.create('condition');
            
        var definition, option;
        
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
            throw new Error("There is no defined condition to process");
        }
        
        action.type = 'condition';
        action.options = options;
        config.end = action;
        
        if (last) {
            last.next = action;
        }
        else {
            config.start = action;
        }
        
    }
];