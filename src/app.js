// serever ko creat karna main task;
const express  = require("express")

const app = express()
//middle ware make readale data for express the body inncommming data
app.use(express.json())

/*
this is a single note
note = {
title:"my first note",
description:"this is my first note i am going to wrote it on the my journy of growth"
}
this is arry to store multiple notes created by user
const notes =[]
*/
const notes = []

// /notes is the name of API
app.post('/notes',(req,res) => {
notes.push(req.body)

res.status(201).json({
    message:"Note created successfully"
})

})
//GET note
app.get('/notes',(req,res) =>{

    res.status(200).json({
        message:"notes fetched successfully",
        notes:notes
    })
})

module.exports = app
 