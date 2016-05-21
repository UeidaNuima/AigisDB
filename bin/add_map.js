var MapModel = require('../models').Map;
var mongoose = require('mongoose');
var co = require('co');
var fs = require('co-fs');

co(function *(){
    try{
        var json = JSON.parse(yield fs.readFile('bin/maps.json', 'utf-8'));
        yield MapModel.create(json);
    } catch(err){
        console.error(err.message);
    } finally {
        yield mongoose.disconnect();
    }

}).catch(function(err){
    console.log(err.stack);
});