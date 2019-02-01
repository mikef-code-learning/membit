const db = require('../models');
const axios = require('axios');

module.exports = function(app) {
    app.get("/", function(req, res) {
        res.render("index");
    });

    // Route for pulling collection
    app.get("/api/collection/:id", function(req, res) {
        let userId = req.params.id;
        db.User.findById(userId).then(function(user){
            user.getGames().then(function (dbusergame) {
                let handlebarsObj = {
                    collection: dbusergame
                };                
                console.log(handlebarsObj);
                res.json(handlebarsObj);
                // res.render("index", handlebarsObj);
            })
        });
    });

    // Route for looking up a game in the Games table, and creating a new row if the game does not exist
    app.get("/api/game/:gamename/:guidValue", function(req, res) {
        let gameName = req.params.gamename;
        let guid = req.params.guidValue
        db.Game.findOrCreate({
            where: {
                title: gameName,
                guid: guid
            }
        }).then(function(game) {
            res.json(game);
        });
    });

    // Route for adding a game to a collection
    app.get("/api/collection/:userId/add/:gameId", function(req,res) {
        let userId = req.params.userId;
        let gameId = req.params.gameId;
        db.User.findById(userId).then(function(user){
            db.Game.findById(gameId).then(function(game){
                user.addGame(game).then(function(dbGame) {
                    res.json(dbGame);
                    console.log(dbGame);
                });
            });
        });
    });

    // Route for a user login/creation.
    app.get("/api/user/:username", function(req, res) {
        let userName = req.params.username;
        db.User.findOrCreate({
            where: {
                username: userName
            }
        }).then(function(user){
            let handlebarsObj = {
                username: user
            };
            console.log(user);
            res.json(user);
            // res.render("index", handlebarsObj);
        });
    });

    // Route for running the search query
    app.get("/api/search/:gametitle", function(req, res) {
        let gametitle = req.params.gametitle
        let queryURL = "https://www.giantbomb.com/api/search/?api_key="+process.env.API+"&query="+gametitle+"&limit=10&resources=game&format=json&field_list=name,guid,image,platforms"
        axios
            .get(queryURL)
            .then(function(response){
                console.log(response.data);
                res.json(response.data);
            });
    });

    // Route for running the Game query to the GB API
    app.get("/api/gamelookup/:guid", function(req, res) {
        let guid = req.params.guid
        let queryURL = "https://www.giantbomb.com/api/game/"+guid+"/?api_key="+process.env.API+"&format=json&field_list=name,image,platforms"
        axios
            .get(queryURL)
            .then(function(response) {
                res.json(response.data);
            })
    });

    // Route for deleting a row in the 'usergame' table when someone wants to remove an item from their collection.
    app.get('/api/collection/:userId/remove/:gameId', function(req, res) {
        let userId = req.params.userId;
        let gameId = req.params.gameId;
        db.User.findById(userId).then(function(user){
            db.Game.findById(gameId).then(function(game){
                user.removeGame(game).then(function(dbGame) {
                    res.json(dbGame);
                    console.log(dbGame);
                });
            });
        });
    });
};