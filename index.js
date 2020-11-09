const express = require('express')
const db = require('./dbConnectExec.js')
const app = express();



app.get("/hi", (req,res)=>{
    res.send('hello world')
})

app.get("/products", (req,res)=>{
    db.executeQuery(`SELECT *
    FROM product
    LEFT JOIN department
    ON department.DepartmentID = product.DepartmentFK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{console.log(err);
    res.status(500).send()})
    
})
app.listen(5000, ()=>{console.log("app is running on port 5000")})
