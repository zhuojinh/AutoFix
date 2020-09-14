var express = require("express");
var router = express.Router({mergeParams: true});
var Shop = require("../models/shop");
var Review = require("../models/review");
var middleware = require("../middleware");

router.get("/", function(req, res){
    Shop.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, shop){
        if(err || !shop) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {shop: shop});
    });
});

router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
    Shop.findById(req.params.id, function(err, shop){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {shop: shop});
    });
});

router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup shop using ID
    Shop.findById(req.params.id).populate("reviews").exec(function (err, shop) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated shop to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.shop = shop;
            //save review
            review.save();
            shop.reviews.push(review);
            // calculate the new average review for the shop
            shop.rating = calculateAverage(shop.reviews);
            //save shop
            shop.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/shops/' + shop._id);
        });
    });
});

router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {shop_id: req.params.id, review: foundReview});
    });
});

router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Shop.findById(req.params.id).populate("reviews").exec(function (err, shop) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate shop average
            shop.rating = calculateAverage(shop.reviews);
            //save changes
            shop.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/shops/' + shop._id);
        });
    });
});

router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Shop.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, shop) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate shop average
            shop.rating = calculateAverage(shop.reviews);
            //save changes
            shop.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/shops/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;