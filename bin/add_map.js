var MapModel = require('../models').Map;
var mongoose = require('mongoose');

var aMap = new MapModel({
    path: ',ストーリーミッション,ジャングル,',
    name: 'オークの勇士',
    karisuma: 72,
    sutamina: 0,
    drop:[
        {
            name: '中忍ハヤテ',
            judge: 1,
            thief: false
        },
        {
            name: '弓兵ウィルフレッド',
            judge: 1,
            thief: false
        },
        {
            name: '密林の老練射手ガガ',
            judge: 5,
            thief: false
        }
    ],
    fullDrop: ['中忍ハヤテ', '弓兵ウィルフレッド', '密林の老練射手ガガ', '密林の老練射手ガガ', '密林の老練射手ガガ', '密林の老練射手ガガ']
});

aMap.save(function(err){
    console.error(err);
    mongoose.disconnect();
});