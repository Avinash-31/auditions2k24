//getting env
require('dotenv').config();

// console.log(process.env.GOOGLE_CLIENT_ID);
// console.log(process.env.GOOGLE_CLIENT_SECRET);
const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const port = process.env.PORT || 3000
const hbs = require('hbs');
const passport = require('passport');
const mongoose = require('mongoose');

// const cookieSession = require('cookie-session');

const cookieParser = require('cookie-parser')

// connecting to connection.js
require("./db/connection");

// Add express-session middleware
app.use(session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Add passport middleware
app.use(passport.initialize());
app.use(passport.session());



// mongoose.set('strictQuery',false);
// const connectDB = async ()=>{
//     try{
//         const conn = await mongoose.connect(process.env.MONGO_URL);
//         console.log(`MongoDB connected: ${conn.connection.host}`);
//     }catch(error){
//         console.log(error);
//         process.exit(1);
//     }
// }

//getting the passport auth
require('./passport-setup')

const { json } = require("express");

// geting defined schema
const Register = require("./models/registers");
const { fileURLToPath } = require('url');
// const { default: mongoose } = require('mongoose');


// path to public, templates and partials 
const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialPath = path.join(__dirname, "../templates/partials");
// console.log(path.join(__dirname,"../public"))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Making express to know that the following are present
app.use(express.static(staticPath));
app.use(express.static(templatePath));
app.use(express.static(partialPath));

app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(cookieParser());
hbs.registerPartials(partialPath);


// Home page
app.get('/', (req, res) => {
    if (req.isAuthenticated() && req.session.registrationDone) {
        return res.redirect('/registrationDone');
    }
    else if (req.isAuthenticated()) {
        return res.redirect('/loginDone');
    }
    else
        res.render("index")
});

// google login page
app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//login success
app.get('/loginDone', async (req, res) => {

    // Check if email already exists in database
    const existingUser = await Register.findOne({ email: req.user.emails[0].value});
    if (existingUser) {
        return res.redirect('/registrationDone');
    }
    else {
        if (req.session.registrationDone) {
            res.render('thanks', { name: req.user.displayName, surName: req.user.name.familyName, fName: req.user.name.givenName, email: req.user.emails[0].value, pic: req.user.photos[0].value });
        }
        // console.log(req.user.displayName);
        // console.log(req.user.name.familyName);
        res.render('register', { name: req.user.displayName, surName: req.user.name.familyName, fName: req.user.name.givenName, email: req.user.emails[0].value, pic: req.user.photos[0].value })
    }
})

//registration success
app.get('/registrationDone', (req, res) => {
    res.render('thanks', { name: req.user.displayName, surName: req.user.name.familyName, fName: req.user.name.givenName, email: req.user.emails[0].value, pic: req.user.photos[0].value })
})

//call back url
app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/failed' }), function (req, res) {
    // console.log("success");
    res.redirect('/loginDone');
})

// Regsiter page loading
app.get('/register', (req, res) => {
    res.render("register");
})

//logout
app.get('/logout',(req,res)=>{
    // req.logout();
    req.logout(() => {});
    res.redirect('/');
})

// post method
app.post('/register', async (req, res) => {
    try {
        // Check if email already exists in database
        // console.log(req.user.emails[0].value);
        const existingUser = await Register.findOne({ email: req.body.email });
        if (existingUser) {
            // console.log('helo');
            return res.redirect('/registrationDone');
        }
        else {
            const registerContestant = new Register({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                domain: req.body.domain,
                yearOfStudy: req.body.yearOfStudy,
                mobileNo: req.body.mobileNo,
                registrationNo: req.body.registrationNo,
                rollNo: req.body.rollNo
            })

            const registered = await registerContestant.save();
            req.session.registrationDone = true;
            // console.log("register done")
            res.status(201).redirect('/registrationDone');
        }
    } catch (error) {
        res.status(400).send(error);
    }

})

app.get('/demo',(req,res)=>{
    // req.logout();
    res.render('demo');
})
app.listen(port, () => {
    console.log(`Server running at port ${port}`)
})

// connectDB().then(()=>{
//     app.listen(port,()=>{
//         console.log(`Listening on port ${PORT}`);
//     })
// });

// other urls

app.get('*',(req,res)=>{
    
        res.render('notFound');
    
})