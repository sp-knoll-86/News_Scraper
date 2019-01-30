let axios = require('axios');
let cheerio = require('cheerio');
let mongoose = require('mongoose');
let db = require("../models");

mongoose.Promise = Promise;
mongoose.connect("mongodb://<dbuser>:<dbpassword>@ds161495.mlab.com:61495/news_scraper", {
    useNewUrlParser: true
});

let mongooseConnection = mongoose.connection;

mongooseConnection.on('error', console.error.bind(console, 'connection error:'));
mongooseConnection.once('open', function() {
  console.log(`Sucessfully Connected to Mongo DB`);
});

module.exports = (app) => {

    app.get("/", (req, res) => res.render("index"));
  
    app.get("/api/search", (req, res) => {
       
  
      axios.get("https://news.yahoo.com/").then(response => {
        let $ = cheerio.load(response.data);
  
        let handlebarsObject = {
          data: []
        };
  
        $("article").each((i, element) => { 
          let lowResImageLink = $(element).children('.item-image').children('.imagewrap').children('a').children('img').attr('src');
  
          if (lowResImageLink) {
  
            let imageLength = lowResImageLink.length;
            let highResImage = lowResImageLink.substr(0, imageLength - 11) + "800-c100.jpg";
  
            handlebarsObject.data.push({ 
              headline: $(element).children('.item-info').children('.title').children('a').text(),
              summary: $(element).children('.item-info').children('.teaser').children('a').text(),
              url: $(element).children('.item-info').children('.title').children('a').attr('href'),
              imageURL: highResImage,
              slug: $(element).children('.item-info').children('.slug-wrap').children('.slug').children('a').text(),
              comments: null
            }); 
          } 
        }); 
    
        res.render("index", handlebarsObject);
         
      });
    });
  
    app.get("/api/savedArticles", (req, res) => {
      db.Articles.find({}).
      then(function(dbArticle) {
        res.json(dbArticle);
      }).catch(function(err) {
        res.json(err);
      });
    }); 
  
    app.post("/api/add", (req, res) => {
  
      let articleObject = req.body;
  
      db.Articles. 
      findOne({url: articleObject.url}).
      then(function(response) {
  
        if (response === null) { 
          db.Articles.create(articleObject).then((response) => console.log(" ")).catch(err => res.json(err));
        }

        res.send("Article Saved");
      }).catch(function(err) {
        res.json(err);
      });
  
    });

    app.post("/api/deleteArticle", (req, res) => {
      sessionArticle = req.body;
  
      db.Articles.findByIdAndRemove(sessionArticle["_id"]). 
      then(response => {
        if (response) {
          res.send("Sucessfully Deleted");
        }
      });
    }); 
  
    app.post("/api/deleteComment", (req, res) => {
      let comment = req.body;
      db.Notes.findByIdAndRemove(comment["_id"]).
      then(response => {
        if (response) {
          res.send("Sucessfully Deleted");
        }
      });
    }); 
  
    app.post("/api/createNotes", (req, res) => {
  
      sessionArticle = req.body;
  
      db.Notes.create(sessionArticle.body).then(function(dbNote) {
        return db.Articles.findOneAndUpdate({
          _id: sessionArticle.articleID.articleID
        }, {
          $push: {
            note: dbNote._id
          }
        });
      }).then(function(dbArticle) {
        res.json(dbArticle);
      }).catch(function(err) {
        res.json(err);
      });
    }); 
  
    app.post("/api/populateNote", function(req, res) {
  
      db.Articles.findOne({_id: req.body.articleID}).populate("Note").
      then((response) => {
  
        if (response.note.length == 1) { 
  
          db.Notes.findOne({'_id': response.note}).then((comment) => {
            comment = [comment];
            console.log("Sending Back One Comment");
            res.json(comment);
          });
  
        } else { 
  
          console.log("2")
          db.Notes.find({
            '_id': {
              "$in": response.note
            }
          }).then((comments) => {
            res.json(comments);
          });
        }
      }).catch(function(err) {
        res.json(err);
      });
    }); 
  
  }