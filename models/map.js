var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

var MapSchema = new Schema({
    path: String,
    name: String,
    karisuma: Number,
    sutamina: Number,
    drop: [{
        name: String,
        judge: Number,
        meta: Number,
        thief: {
            type: Boolean,
            default:false
        }
    }],
    available: {
        type: Boolean,
        default: true
    },
    fullDrop: [String]
});

MapSchema.index({path: 1});
MapSchema.index({name: 1}, {unique: true});

mongoose.model('Map', MapSchema);