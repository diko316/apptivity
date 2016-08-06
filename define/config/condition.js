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
            options = null,
            lastOptions = null,
            last = config.end;
            
        var definition, action, option, id;
        
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
        id = 'condition' + (++CONDITION_ID_GEN);
        config.end = action = {
            type: 'condition',
            id: id,
            name: id,
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