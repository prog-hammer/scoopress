const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

var Posts=require('../models/post')
var bodyParser = require('body-parser')

var postRouter = express.Router()
postRouter.use(bodyParser.json())

const mongoUrl=require('../config');
const conn=mongoose.createConnection(mongoUrl);

let gfs;
var postId=null;
var file=null;
conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('posts');
  });
var randomFilename=null

crypto.randomBytes(24, function(err, buffer) {
    randomFilename = buffer.toString('hex');
  });

var storage = new GridFsStorage({
        url: mongoUrl,
        file: (req, file) => {
            console.log(file)
            return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    console.log("entered")
                return reject(err);
                }
                const filename = randomFilename //+ path.extname(file.originalname);
                const fileInfo = {
                filename: filename,
                metadata : req.body,
                bucketName: 'posts'
                };
                resolve(fileInfo);
        });
        });
        }
});
const upload = multer({ storage });

postRouter.get('/',function(req,res){
    /*
    Posts.find().sort({dateCreated:-1}).exec(function(err,docs){
        if(err){
            res.status(500).send("Error Occured");
        }
        else{
            res.send(docs);
        }
    })
    */

    gfs.files.find().toArray((err, files) => {
        res.send(files)
    });
    
})
postRouter.post('/',upload.array('file',10),function(req,res){
    crypto.randomBytes(24, function(err, buffer) {
        randomFilename = buffer.toString('hex');
      });
    res.redirect('/')
})
postRouter.get('/:filename',function(req,res){


    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(err){
            res.status(500).send("Error Occured");
        }
        else{
            res.send(file);
        }
    })
    
})
postRouter.put('/:filename',function(req,res){
    console.log(req.params.filename)
    gfs.files.updateOne({filename: req.params.filename},{ $set:req.body},function(err,file){
        if(err){
            res.status(500).send("Error Occured");
        }
        else{
            res.send(file);
        }
    }
    )
})

postRouter.delete('/:filename',function(req,res){
    gfs.remove({ filename: req.params.filename, root: 'posts' }, (err, gridStore) => {
        if (err) {
          return res.status(404).json({ err: err });
        }
        else{
            res.redirect('/');
        }
      });
})

module.exports=postRouter;