require('dotenv').config();

const express = require('express');
const app = express();
const connectDB = require('./server/config/db');
const PORT = 5000 || process.env.PORT;

const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const session = require('express-session');

const expressLayout = require('express-ejs-layouts');
const mentodOverride = require('method-override');
const  {isActiveRoute} = require('./server/helper/routerHelper');

//connect to db
connectDB();    

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized:true,
    store : MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
}))
app.use(mentodOverride('_method'));

app.locals.isActiveRoute = isActiveRoute;

//templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');


app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

app.listen(PORT);