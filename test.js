'use strict';

var workflow = require('./index.js');

workflow.create('createUser').

        action('requestForm').
            describe('this is a test').
            guard(function (data) {
                
                console.log(' guard! ');//, data);
                
                return data;//require('bluebird').reject('buang!');
                
            }).
            handler(function (data) {
                console.log('handler requestForm', data);
                return data;
            }).
            
        action('render').
            describe('rendering form').
            handler(function (data) {
                console.log('rendering!');
                return data;
            }).
            
        condition(
            workflow.activity('renderedToHTML').
                action('renderDom1').
                    guard(function () {
                        //console.log('you cannot pass renderDom1');
                        //return require('bluebird').reject('no!');
                    }).
                    handler(function (data) {
                        console.log('handler renderedToHTML');//, data);
                        return data;
                    }),
                
            workflow.activity('failedRender').
                action('renderDom').
                    guard(function () {
                        console.log('guard! failedRender');
                        return 'good!';
                    }).
                    handler(function (data) {
                        console.log('handler failedRender');//, data);
                        return data;
                    })
                
        ).
        
        input('test-input').
            handler(function (data) {
                console.log('**********************');
                console.log('prompting! ', data);
                console.log('**********************');
                return {
                    name: 'prompt'
                };
            }).
        
        action('last').
            handler(function (data) {
                console.log('handler last');//, data);
                return { name: 'last' };
            });





workflow('createUser').

    on('state-change',
        function (session, data) {
            console.log('state: ', session.state === data);
            //console.log('state: ', session.state.toJSON());
            //console.log('data: ', data.toJSON());
        }).
    
    on('prompt',
        function (session, action) {
            console.log('answering! ', action);
            //session.destroy();
            session.answer(action, {name: 'yes!'});
            
        }).
    
    run({ name: 'buang' });