const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const flash  = require('connect-flash');
// app.use(flash()); // req.flash() -> requires sessions
const session = require('express-session');
// const mongoose = require('mongoose');
// for passport
const passport = require('passport');
const LocalStrategy = require('passport-local');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connect MongoDB at default port 27017.
mongoose.connect('mongodb://localhost:27017/ismConnect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});

const User = require('./models/user');

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// for passport:
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// for flash
app.use(flash());

// GLOBAL VARS:
app.use((req, res, next) => {
    res.locals.currentUser = req.user; // 'req.user' will be a true if user is loggedIn
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
})

const typespeedSchema = new mongoose.Schema({
  email: String,
  wpm: [Number]
});
const typespeed = mongoose.model('typespeed', typespeedSchema);

app.get('/fake', async (req,res) => {
    const u = new User({email: 'ok@gmail.com', username: 'pp'});
    const newU = await User.register(u, 'pass'); // this '.register' takes the object and password, hashes the password and stores it to that document.
    res.send(newU);
})

const {isLoggedIn} = require('./middleware');

app.get('/home', isLoggedIn, (req,res) => {
  // console.log();
     res.render('home',{uemail:req.user.username});
 });
app.get('/dashboard',isLoggedIn, async function(req,res){
  const mail = req.user.email;
  let currObj = await typespeed.findOne({email: mail});
  // console.log(currObj);
  let aver=0.0;
  for(var i=0;i<currObj.wpm.length;i++)
  {
    aver+=(currObj.wpm[i]);
  }
  aver=aver/(currObj.wpm.length);
  console.log(aver);
  res.render('dashboard',{uemail:req.user.username,userdata:currObj,avg:aver});
});
app.post("/dashboard",function(req,res){
  res.redirect("/dashboard");
});
 app.post("/home", async function(req,res){
   // console.log(req.user.email);
   const wpm = req.body.WPM;
   const mail = req.user.email;
   // const re = typespeed.updateOne(
   //    { "email" : mail},
   //    { $push: {"wpm": wpm} }
   // );
   // console.log(re.acknowledged);
   // var arrofspeeds=[];

   let currObj = await typespeed.findOne({email: mail});
   if(currObj==null)
   {
     // console.log("here");
     const newobj = new typespeed({
       email : mail,
       wpm: [req.body.WPM]
        });
        await newobj.save();
   }
   else
   {
     currObj.wpm.push(wpm);
     await currObj.save(function(err){
       console.log(err);
     });
   }
   // console.log(currObj);
   // currObj[0].wpm.push(wpm);
   // currObj[0].save(function(err){
   //   console.log(err);
   // });
   res.redirect("/home");

   // await typespeed.find({email:mail},function(err,foundspeeds){
   //   if(!err){
   //     console.log("yes");
   //     arrofspeeds = foundspeeds[0].wpm;
   //     arrofspeeds.push((Number)(wpm));
   //     typespeed.updateOne(
   //        { email : mail},
   //        { wpm : arrofspeeds}
   //     );
       // typespeed.updateOne({email:mail},{wpm:arrofspeeds})
       // typespeed.deleteOne({email:mail});
       // const nwpm = new typespeed({
       //   email: mail,
       //   wpm: arrofspeeds
       //    });
       //    nwpm.save(function(err){
       //      if(!err)
       //      {
       //        res.redirect("/home/"+req.body.mail);
       //      }
       //      else
       //      {
       //        console.log(err);
       //      }
       //    });
     // }
     // else
     // {
     //   console.log(err);
     // }
   });


// ROUTES:
// Authentication:
app.use('/users', require('./routes/auth'));

//  ERROR HANDLER:
app.use((err, req, res, next) => {
    if (!err.status) err.status = 500;
    if (!err.message) err.message = 'Something went wrong!';
    res.render('error', { err });
})

const port = process.env.PORT || 3000;
app.listen(port);
