'use strict';


var SYMBOL = require('./symbol.js');

SYMBOL.register('workflow', {
    
    configure: function (config) {
        
        config.start = null;
        config.end = null;
        
    },
    
    activities: function () {
        var symbol = SYMBOL,
            list = arguments,
            l = list.length,
            c = -1;
            
        var item;
        
        for (; l--;) {
            item = list[++c];
            
            // create transition
            if (symbol.is(item)) {
                
                this.onSetActivity(item);
                
            }
        }
        
        return this;
    },
    
    onSetActivity: function (item) {
        var config = this.config,
            end = config.end,
            current = {
                item: item.id,
                next: null
            };
            
        if (end) {
            config.end = end.next = current;
        }
        else {
            config.start = config.end = current;
        }
        
    }
});