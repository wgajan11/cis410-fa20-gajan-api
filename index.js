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
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
    
})

app.get("/products/:ProductID", (req,res)=>{
    var pk = req.params.ProductID
    // console.log(pk)

    var myQuery = `SELECT *
    FROM product
    left join department
    on department.DepartmentID = Product.DepartmentFK
    where ProductID = ${pk}`

    db.executeQuery(myQuery)
        .then((products)=>{
            // console.log(products)

            if(products[0]){
                res.send(products[0])

            }
            else{res.status(404).send("bad requeset")}
        })
        .catch((err)=>{
            console.log("error in /products/pk", err)
            res.status(500).send()
        })
})


app.listen(5000, ()=>{console.log("app is running on port 5000")})
