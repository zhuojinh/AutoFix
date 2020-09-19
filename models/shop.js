var mongoose = require("mongoose");

var shopSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectID,
            ref: "User"
        },
        username: String
    }, 
    comments: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: "Comment"
        }
    ], 
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref:"Review"
        }
    ], 
    rating: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Shop", shopSchema);