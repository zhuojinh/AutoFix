var express = require("express");
var router = express.Router();
var Shop = require("../models/shop");
var Review = require("../models/review");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

router.get("/", function(req, res){
    Shop.find({}, function(err, allShops){
        if(err){
            console.log(err);
        } else{
            res.render("shops/index", {shops: allShops});
        }
    });
}); 

router.post("/", middleware.isLoggedIn, function(req,res){
    var name = req.body.name;
    var image = req.body.image;
    var dsc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newShop = {name: name, image: image, description: dsc, author: author, location: location, lat: lat, lng: lng};
    Shop.create(newShop, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            res.redirect("/shops");
        }
    }); 
});
});

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("shops/new");
});

router.get("/:id", function (req, res) {
    //find the shop with provided ID
    Shop.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundShop) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that shop
            res.render("shops/show", {shop: foundShop});
        }
    });
});

router.get("/:id/edit", middleware.checkShopOwnership, function(req, res){
    Shop.findById(req.params.id, function(err, foundShop){
        res.render("shops/edit", {shop: foundShop});
    });
});

router.put("/:id", middleware.checkShopOwnership, function(req, res){
    geocoder.geocode(req.body.shop.location, function (err, data) {
        if (err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.shop.lat = data[0].latitude;
        req.body.shop.lng = data[0].longitude;
        req.body.shop.location = data[0].formattedAddress;
    
    Shop.findByIdAndUpdate(req.params.id, req.body.shop, function(err, updatedShop){
        if(err){
            req.flash("error", err.message);
            res.redirect("/shops");
        } else{
            req.flash("success","Successfully Updated!");
            res.redirect("/shops/" + req.params.id);
        }
    });
});
});

router.delete("/:id", middleware.checkShopOwnership, function (req, res) {
    Shop.findById(req.params.id, function (err, shop) {
        if (err) {
            res.redirect("/shops");
        } else {
            // deletes all comments associated with the shop
            Comment.remove({"_id": {$in: shop.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/shops");
                }
                // deletes all reviews associated with the shop
                Review.remove({"_id": {$in: shop.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/shops");
                    }
                    //  delete the shop
                    shop.remove();
                    req.flash("success", "Shop deleted successfully!");
                    res.redirect("/shops");
                });
            });
        }
    });
});

module.exports = router;