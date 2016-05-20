var mongoose = require('mongoose');
var settings = require('../settings');

mongoose.connect(settings.db, function (err) {
    if(err)
        console.log('%s ERROR: ', settings.db, err.message);
});

require('./map');
require('./submit');

exports.Map = mongoose.model('Map');
exports.Submit = mongoose.model('Submit');