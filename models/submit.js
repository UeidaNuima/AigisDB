var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubmitSchema = new Schema({
    times: {
        type: Number,
        default: 1,
        min: 1
    },
    ip: String,
    map: {
        type: String,
        required: true
    },
    thief: {
        type: Number,
        default: 0,
        min: 0,
        max: 2
    },
    drop: [{
        name: String,
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    }]
});

SubmitSchema.index({map: 1});

mongoose.model('Submit', SubmitSchema);