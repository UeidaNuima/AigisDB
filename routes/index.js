var express = require('express');
var MapModel = require('../models').Map;
var SubmitModel = require('../models').Submit;
var _ = require('lodash');
var co = require('co');
var MarkdownIt = require('markdown-it');
var md = new MarkdownIt();
var fs = require('co-fs');

//TODO: 数据库异常处理
//TODO: 从路由中拆查询与离运算逻辑
module.exports = function(app){

    //主页以及查看掉落
    app.get('/', function(req, res){
        co(function *(){
            var thisMap;
            var about;

            //选择了图的情况
            if(req.query.map){
                var mapInfo = yield MapModel.findOne({name: req.query.map});
                //无效图名
                if(!mapInfo){
                    res.redirect('/');
                    return;
                }

                //查询记录条数以及周回次数
                var submitSum = yield SubmitModel.aggregate({
                    $match:{map: mapInfo.name}
                }, {
                    $group:{
                        _id: '$map',
                        count: {$sum: 1},
                        times: {$sum: '$times'}
                    }
                }).exec();

                submitSum = submitSum[0];
                //没有数据的情况
                if(!submitSum)
                    submitSum = {
                        count: 0,
                        times: 0
                    };

                //查询所有掉落
                var dropInfo = yield SubmitModel.aggregate({
                    $unwind: '$drop'
                },{
                    $match: {map: mapInfo.name}
                },{
                    $group: {
                        _id: {
                            name: '$drop.name',
                            thief: '$thief'
                        },
                        sumQuantity: {$sum: '$drop.quantity'},
                        times: {$sum: '$times'}
                    }
                },{
                    $sort:{'_id.thief': 1}
                },{
                    $group: {
                        _id: '$_id.name',
                        times: {$sum: '$times'},
                        sumQuantity: {$sum: '$sumQuantity'},
                        drop: {
                            $push: {
                                thief: '$_id.thief',
                                sumQuantity: '$sumQuantity',
                                times: '$times'
                            }
                        }
                    }
                },{
                    $project: {
                        name: '$_id',
                        times: '$times',
                        sumQuantity: '$sumQuantity',
                        drop: '$drop'
                    }
                }).exec();


                //聚合掉落信息
                var dropSum = [];
                mapInfo.drop.forEach(function(drop1){
                    var aDrop = {
                        name: drop1.name,
                        judge: drop1.judge,
                        sumJudge: drop1.judge*submitSum.times,
                        sumQuantity: 0,
                        dropRate: (0).toFixed(2)
                    };
                    dropInfo.forEach(function(drop2){

                        //drop1为地图掉落信息, drop2为提交掉落信息
                        if(drop1.name == drop2.name){
                            aDrop.sumQuantity = drop2.sumQuantity;
                            aDrop.drop = [];
                            var sumDropRate = 0;
                            for(var t=0; t<drop2.drop.length; t++){
                                var thief = "";
                                switch(drop2.drop[t].thief){
                                    case 1:
                                        thief = "非觉醒作死"; break;
                                    case 2:
                                        thief = "觉醒作死"; break;
                                }
                                aDrop.drop.push({
                                    thief: thief,
                                    times: drop2.drop[t].times,
                                    sumJudge: drop1.judge*drop2.drop[t].times,
                                    sumQuantity: drop2.drop[t].sumQuantity,
                                    dropRate: ((drop2.drop[t].sumQuantity/drop1.judge/drop2.drop[t].times)*100).toFixed(2)
                                });

                                //作死的情况重新计算总落率
                                var buff;
                                switch(drop2.drop[t].thief){
                                    case 1:
                                        buff = 0.03; break;
                                    case 2:
                                        buff = 0.05; break;
                                    default:
                                        buff = 0; break;
                                }
                                sumDropRate += drop2.drop[t].times*(drop2.drop[t].sumQuantity/drop1.judge/drop2.drop[t].times - buff);
                            }
                            aDrop.dropRate = ((sumDropRate/submitSum.times)*100).toFixed(2);
                        }
                    });
                    dropSum.push(aDrop);
                });


                //聚合地图信息
                thisMap = {
                    name: mapInfo.name,
                    //偷懒, 以第一个掉落判断全图作死是否有效
                    thief: mapInfo.drop[0].thief,
                    karisuma: mapInfo.karisuma,
                    sutamina: mapInfo.sutamina,
                    available: mapInfo.available,
                    fullDrop: mapInfo.fullDrop,
                    count: submitSum.count,
                    times: submitSum.times,
                    drop: dropSum
                };
            } else {
                //没选图的情况
                thisMap = {
                    name:""
                };

            }

            /*if(!thisMap){

            }*/

            about = md.render(yield fs.readFile('README.md', 'UTF-8'));


            var maps = yield MapModel.find();
            var mapTree = {};

            //把物化路径拆回成树
            maps.forEach(function(map){
                var path = _.compact(map.path.split(','));
                var node = mapTree;
                path.forEach(function(dir){
                    if(!node[dir]){
                        node[dir] = {
                            name: dir,
                            mapTree: {}
                        };
                    }
                    node = node[dir];
                    if(map.name == thisMap.name){
                        node['selected'] = true;
                    }
                    node = node.mapTree;
                });
                node[map.name]={
                    name: map.name,
                    karisuma: map.karisuma,
                    sutamina: map.sutamina
                };
                if(map.name == thisMap.name){
                    node[map.name]['selected'] = true;
                }
            });

            //渲染之
            res.render('index', { mapTree: mapTree, map: thisMap, about: about});
        }).catch(function(err){
            console.log(err.stack);
        });
    });


    //投稿
    app.post('/submit',function(req, res){
        co(function *() {
            var content;
            var map;

            // 确定地图
            try{
                map = yield MapModel.findOne({name: req.query.map});
                if(!map) throw new Error("Unresolved map name.");
            } catch(e) {
                content = {
                    stat: 1,
                    msg: "无效图名"
                }
            }
            if(content){
                res.json(content);
                return;
            }

            // 构建存储文档
            try{
                var aSubmit = new SubmitModel({
                    times: req.body.times,
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    map: req.query.map,
                    drop: []
                });

                if(map.drop[0].thief){
                    aSubmit.thief = req.body.thief;
                }

                map.drop.forEach(function (drop) {
                    if(!req.body[drop.name]) throw new Error("Lack one or a few drops.");
                    if(req.body[drop.name] > req.body.times*drop.judge) throw new Error("Amount too large.");
                    aSubmit.drop.push({
                        name: drop.name,
                        quantity: req.body[drop.name]
                    });
                });
            } catch(e) {
                console.error(e.stack);
                content = {
                    stat: 1,
                    msg: "信息有误"
                }
            }
            if(content){
                res.json(content);
                return;
            }

            //存储
            try{
                yield aSubmit.save();
            } catch(e) {
                content = {
                    stat: 1,
                    msg: "验证失败"
                }
            }
            if(content){
                res.json(content);
                return;
            }

            res.json({
                stat: 0,
                msg: "OK"
            });
        });
    });
};
