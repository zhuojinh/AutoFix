var express = require("express");
var router = express.Router({mergeParams: true});
var Shop = require("../models/shop");
var Comment = require("../models/comment");
var middleware = require("../middleware");

router.get("/new", middleware.isLoggedIn, function(req, res){
    Shop.findById(req.params.id, function(err, shop){
        if(err){
            console.log(err);
        } else{
            res.render("comments/new", {shop: shop});
        }
    });
});

router.post("/", middleware.isLoggedIn, function(req, res){
    Shop.findById(req.params.id, function(err, shop){
        if(err){
            console.log(err);
            res.redirect("/shops");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    res.redirect("/shops");
                } else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    shop.comments.push(comment);
                    shop.save();
                    req.flash("success", "Successfuly Add Comment");
                    res.redirect("/shops/" + req.params.id);
                }
            })
        }
    })
});

router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else{
            res.render("comments/edit", {shop_id: req.params.id, comment: foundComment});
        }
    });
});

router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err) {
            res.redirect("back");
        } else {
            res.redirect("/shops/" + req.params.id);
        }
    });
});

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment Deleted");
            res.redirect("/shops/" + req.params.id);
        }
    });
});

module.exports = router;