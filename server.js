let express = require('express');
let bodyParser = require('body-parser');
let exphbs = require('express-handlebars');
var db = require("./models");
let PORT = process.env.PORT || 3001;
let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

require("./controllers/web-scraper-controller.js")(app);

app.listen(PORT, ()=>{
    console.log(`App listening on PORT ${PORT}`);
})