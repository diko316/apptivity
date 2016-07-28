'use strict';

require('./symbol.js').register('guard', {
    
    initialize: function () {
        this.config.callback = null;
    },
    
    callback: function (callback) {
        if (callback instanceof Function) {
            this.config.callback = callback;
        }
        return this;
    }
});
