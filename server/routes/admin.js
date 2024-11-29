const express = require('express');
const router = express.Router();
const postModel= require('../models/Post');
const userModel= require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const adminLayout = '../views/layouts/admin';

const isLoggedIn = (req, res, next)=>{
    const token = req.cookies.token;
    
    if(!token){
        return res.status(401).json( { message: 'Unauthorized'} );
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded;
        next();
    } catch (error) {
        res.status(401).json( { message: 'Unauthorized'} );
    }
}

router.get("/admin", (req, res)=>{
   try {
    const locals={
        title:"admin Page",
        description : "Nice admin page"
    }

    res.render('admin/index', {locals, layout:adminLayout});

   } catch (error) {
    console.log(error);
    
   }
})

router.post("/admin/login", async (req, res)=>{
    try{
        const {username, password} = req.body;

        const user = await userModel.findOne({username});

        if(!user){
            return res.status(401).json({message:"Invalid username or password"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({message:"Invalid username or password"});
        }

        const token =  jwt.sign({userId: user._id}, jwtSecret);
        res.cookie('token', token);
        res.redirect("/dashboard");
    }   
    catch(error){
        console.log(error);
    }
});

router.get("/dashboard", isLoggedIn, async (req, res)=>{
try {
    let perPage = 10;
    let page = req.query.page || 1;

    const data = await postModel.aggregate([ {$sort: {createdAt : -1}} ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();


    const count = await postModel.countDocuments();
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    const locals={
        title:"admin Page",
        description : "Nice admin page"
    }
    
    res.render("admin/dashboard", {locals, 
        data, 
        layout:adminLayout,
        current:page,
        nextPage: hasNextPage ? nextPage : null,
        currentRoute: '/'
    });
} catch (error) {
    console.log(error);
}
})


router.post("/admin/register", isLoggedIn, async (req,res)=>{

    try {
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
            const user = await userModel.create({username, password:hashedPassword});
            res.status(201).json({message:"User create", user});
        } catch (error) {
            
            if(error.code === 11000 ){
                res.status(409).json({message:'user already in use'});
            }
            else{
                res.status(500).json({message:'Internal server error'});
            }
        }
    } catch (error) {
        console.log(error);
    }
});

router.get("/add-post", isLoggedIn, async (req,res)=>{
    try {
        const locals={
            title:"create new post",
            description : "Nice admin page"
        }
       res.render('admin/add-post', {locals, layout:adminLayout});
    } catch (error) {
       console.log(error);
    }
});

router.post("/add-post", isLoggedIn, async (req,res)=>{
    try {
        const {title, body} = req.body;
        await postModel.create({
            title,
            body
        })
        res.redirect("/dashboard");
    } catch (error) {
       console.log(error);
    }
});


router.get('/logout', (req, res)=>{
    res.cookie("token", "");
    res.redirect("/admin"); 
})

router.get('/edit-post/:id', async (req, res)=>{
    try {
        const data = await postModel.findOne({_id : req.params.id});
       res.render('admin/edit-post', { data, layout:adminLayout });
    } catch (error) {
        console.log(error);    
    }
})

router.put('/edit-post/:id', async (req, res)=>{
    try {
        await postModel.findByIdAndUpdate(req.params.id,{
            title:req.body.title,
            body : req.body.body,
            updatedAt : Date.now()
        });
        res.redirect('/dashboard');
       
    } catch (error) {
        console.log(error);    
    }
})


router.delete('/delete-post/:id', async (req, res)=>{
    try {
      await postModel.findOneAndDelete({_id: req.params.id});
      res.redirect('/dashboard');
       
    } catch (error) {
        console.log(error);    
    }
})

module.exports = router;