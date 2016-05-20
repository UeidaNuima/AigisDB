var MapModel = require('../models').Submit;
var mongoose = require('mongoose');

var aSubmit = new MapModel({
    ip: '127.0.0.1',
    map: '仮初の必殺剣',
    thief: 0,
    drop: [
        {
            name: '英霊の魂x5',
            quantity: 3
        },
        {
            name: '英霊の魂x3',
            quantity: 1
        }
    ],
    times: 1
});

aSubmit.save(function(err){
    console.error(err);
    mongoose.disconnect();
});