var Shop = require("../models/shop");
var Comment = require("../models/comment");
var Review = require("../models/review");

var middlewareObj = {};

middlewareObj.checkShopOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Shop.findById(req.params.id, function(err, foundShop){
            if(err || !foundShop){
                req.flash("error", "Shop Not Found");
                res.redirect("back");
            } else {
                if(foundShop.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "Permission Denied!");
                    res.redirect("back");
                }
            }
        });
        } else{
        req.flash("error", "You need to be logged in to do that!!");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "Permission Denied!");
                    res.redirect("back");
                }
            }
        });
        } else{
        req.flash("error", "You need to be logged in to do that!!");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!!");
    res.redirect("/login");
};

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Shop.findById(req.params.id).populate("reviews").exec(function (err, foundShop) {
            if (err || !foundShop) {
                req.flash("error", "Shop not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundShop.reviews
                var foundUserReview = foundShop.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/shops/" + foundShop._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObj;