//setting environment parameter: Google Geocoder API
require("dotenv").config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");

var Comment = require("./models/comment");
var Campground = require("./models/campground");
var User = require("./models/user");

var commentRoutes = require("./routes/comments");
var reviewRoutes = require("./routes/reviews");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");

//mongoose configuration
mongoose.connect('mongodb://localhost:27017/AutoFix_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));

//seedDB();
//express configuration
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

//passport configuration
app.use(require("express-session")({
    secret: "Once again",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//use routes
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(80,function(){
    console.log("The AutoFix Server has started!");
});
