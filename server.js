const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const bodyparser = require("body-parser");
const path = require('path');
const cookieParser = require('cookie-parser')

// Google Auth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '593315632475-3e2gdpuhtpgc0gkjf72qor7d2g1rvjik.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);

const connectDB = require('./server/database/connection');

const app = express();

dotenv.config( { path : 'config.env'} )
const PORT = process.env.PORT || 8080

// log requests
app.use(morgan('tiny'));

// mongodb connection
connectDB();

// parse request to body-parser
app.use(bodyparser.urlencoded({ extended : true}))

// set view engine
app.set("view engine", "ejs")
//app.set("views", path.resolve(__dirname, "views/ejs"))
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// load assets
app.use('/css', express.static(path.resolve(__dirname, "assets/css")))
app.use('/img', express.static(path.resolve(__dirname, "assets/img")))
app.use('/js', express.static(path.resolve(__dirname, "assets/js")))

// load routers
app.use('/', require('./server/routes/router'))

app.get('/login',(req,res)=>{
  res.render('login')
})

app.post('/login', (req,res)=>{
  let token = req.body.token;

  async function verify() {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      });
      const payload = ticket.getPayload();
      const userid = payload['sub'];
    }
    verify()
    .then(()=>{
        res.cookie('session-token', token);
        res.send('success')
    })
    .catch(console.error);

})

app.get('/profile', checkAuthenticated, (req, res)=>{
  let user = req.user;
  res.render('profile', {user});
})

app.get('/logout', (req, res)=>{
  res.clearCookie('session-token');
  res.redirect('/login')

})


function checkAuthenticated(req, res, next){

  let token = req.cookies['session-token'];

  let user = {};
  async function verify() {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      });
      const payload = ticket.getPayload();
      user.name = payload.name;
      user.email = payload.email;
      user.picture = payload.picture;
    }
    verify()
    .then(()=>{
        req.user = user;
        next();
    })
    .catch(err=>{
        res.redirect('/login')
    })

}


app.listen(PORT, ()=> { console.log(`Server is running on http://localhost:${PORT}`)});