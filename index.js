const express = require("express");
const ejs = require("ejs");
const { forEach } = require("lodash");
const _ = require('lodash');
const mongoose = require("mongoose");
const date = require(__dirname + '/date.js');
require('dotenv').config();
const mailchimp = require("@mailchimp/mailchimp_marketing");

const login = process.env.LOGIN;
const password = process.env.PASSWORD;
const uri = process.env.MONGO_URI;
const apiKey = process.env.API_KEY;
const server = process.env.SERVER;

mailchimp.setConfig({
  apiKey: apiKey,
  server: server,
});

const connectDB = async () => {
  try {
      const conn = await mongoose.connect(uri);
      console.log('MongoDB Connected.');
  } catch (error) {
      console.log(error);
      console.log(uri);
      process.exit(1)
  }
}

const postSchema = new mongoose.Schema({
  title: String,
  body: String
})

const Post = mongoose.model("Post", postSchema);

const post1 = new Post({
  title: "SPIDER-MENACE STRIKES AGAIN",
  body: "Masked Marauder, A.K.A. Spider-Man has attacked the Power Grid outside the city and J. Jonah Jameson is LIVE with an exclusive interview with an eyewitness who saw Spider-Man with their own eyes destroying multiple powerlines!"
})

const post2 = new Post({
  title: "THE TRUE HERO",
  body: "The war on fake news has a hero: J JONAH JAMESON and THE DAILY BUGLE.NET! Where the tides of real news crash the shore of dangerous truth, the Daily Bugle will be there! Read the stories that the super-powers-that-be don’t want you to know! Stay informed! Be a real hero! Listen… to the BUGLE! Update: We want to take a moment and thank you, the people, for your resounding support of The Daily Bugle! We are a unified, like-minded network of people who all share the same passion to expose to truth no matter the cost."
})

const post3 = new Post({
  title: "SAVIES! THE NEW SELFIES",
  body: "There's a dangerous new trend on social media.Savie  are a selfie taken while being saved by a superhero. Young people are purposely putting themselves in dangerous situations in hopes of getting a savi to boost their online social presence. County police urge people to ignore this silly trend and stick to workout selfies. We at the Daily Bugle cannot stress this enough, DO NOT TRY THIS AT HOME!"
})

const post4 = new Post({
  title: "SHOCKING VIDEO RAISES DARK QUESTIONS ABOUT LONDON ATTACK!",
  body: "Eugene Thompson’s high school friends call him “Flash” - but no one could have predicted how prophetic that nickname would become in the aftermath of the London attacks! In a flash of lightning and thunder, the fourth of the so-called “Elementals” was unleashed upon our world - and only the great Mysterio stood in his way. In this exclusive video, TheDailyBugle.net readers can get a first-hand glimpse at the panic and chaos on the streets of London... ... but they can also hear Flash’s ominous tone as he describes the storm falling to a swarm of “drones.” Other eye-witness accounts corroborate this strange occurrence - and we at the Bugle have to ask: what was this technology doing at the site of an Elemental attack? Is there something more to this event? And what to make of the much-remarked-upon appearance of that webbed menace, Spider-Man? Watch the video and send us your theories today!"
})

Post.find()
.then((result)=>{
  if(result.length === 0){
    console.log("No posts, creating new ones.");
    Post.insertMany([post1, post2, post3, post4])
    .then(()=>{
      console.log("Success");
    })
  } else{
    console.log("Everything is fine.");
  }
})

const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use('*/css',express.static('public/css'));
app.use('*/img',express.static('public/img'));

app.get('/', (req, res) => {
  const day = date.getDate();
  Post.find()
  .then((result)=>{
    res.render("home", {posts: result, day: day});
  })
})

app.get('/about', (req, res) => {
  res.render("about", {aboutContent: aboutContent});
})

app.get('/contact', (req, res) => {
  res.render("contact", {contactContent: contactContent});
})

app.get('/newsletter', (req, res) => {
  res.render("newsletter")
})

app.post('/newsletter', (req, res) => {
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  const data = {
    members: [
        {
            email_address: email,
            status: "subscribed",
            merge_fields: {
                FNAME: firstName,
                LNAME: lastName,
            }
        }
    ]
  }

  const run = async (data) => {
    const response = await mailchimp.lists.batchListMembers("b0ed5b3da8", data);

    const errors = response.errors;
    const errorLength = errors.length;
    
    console.log("Number of errors:", errorLength);
    if (errorLength > 0){
        console.log("Errors:");
        for (var i = 0; i < errorLength; i++){
            console.log(errors[i].error);
        }
        res.render("failure")
    }else{
        console.log("Success!");
        res.render("success")
    }        
  };

  run(data);
})

app.get('/login', (req, res) => {
  res.render("login", {isWrong: ""})
})

app.post('/login', (req, res) =>{
  const userID = req.body.userId;
  const userPassword = req.body.password;

  if (login == userID && password == userPassword){
    res.render("compose")
  }else{
    console.log("Wrong UserID or password, try again.");
    res.render("login", {isWrong: "Wrong User ID or Password, try again."})
  }
})

app.get('/compose', (req, res) => {
  res.render("compose")
})

app.post("/compose", (req, res) => {
  const newPost = new Post ({
    title: req.body.postTitle,
    body: req.body.postBody
  });

  newPost.save()
  .then(()=>{
    console.log("Successfuly created a new post!");
    res.redirect("/");
  });
})

app.get("/posts/:postId", (req, res) => {
  const postId = req.params.postId;

  Post.findById(postId)
  .then((result) => {
    res.render("post", {post: result});
  })
  .catch((err)=>{
    console.log(err);
  })
})

connectDB().then(() => {
  app.listen(3000, () => {
      console.log(`Server running on port 3000`);
  });
})

