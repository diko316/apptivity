'use strict';

describe('activity(name:String) Create and Register Activity',
    function () {
        var api = use('index.js');
        
        it('should accept activity workflow name',
            function () {
                api.activity('activity name');
            });
    });