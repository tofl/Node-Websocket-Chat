express = require('express');
let app = module.exports = express();

app.set('view engine', 'jade');

app.get("/", (req, res) => {
    res.render('home');
});

app.get("/js", (req, res) => {
    res.sendFile(__dirname + "/views/app.js");
});

app.listen(3000, () => { console.log("server listening on port 3000"); });