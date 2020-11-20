const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('./dbConnectExec.js')

const jwt = require('jsonwebtoken')
const cors = require('cors')
const config = require('./config.js')
const auth = require('./middleware/authenticate')
app.use(express.json())
const app = express();
app.use(cors())

app.get('/customer/me', auth,(req,res)=>{
    res.send(req.customer)
})
app.post("/reviews", auth, async (req,res)=>{

    try{
                var productFK = req.body.productFK;
                var review = req.body.review;
                var rating = req.body.rating;
        
                if(!productFK || !review || !rating){res.status(400).send("bad request")}
        
                review = review.replace("'","''")
        
                let insertQuery = `INSERT INTO Reviews(Review, Rating, ProductFK, CustomerFK)
                OUTPUT inserted.ReviewPK, inserted.Review, inserted.Rating, inserted.CustomerFK
                VALUES('${review}','${rating}','${productFK}','${req.customer.CustomerPK}')`

        let insertedReview = await db.executeQuery(insertQuery)

        // console.log(insertedReview)
        res.status(201).send(insertedReview[0])
    }
    catch(error){
        console.log("error in POST /review", error);
        res.status(500).send()
    }
})

// app.post("/reviews", auth, async (req, res)=>{
//     // try{
//         var productFK = req.body.productFK;
//         var review = req.body.review;
//         var rating = req.body.rating;

//         if(!productFK || !review || !rating){res.status(400).send("bad request")}

//         // summary = summary.relace("'","''")

//         // let insertQuery = `INSERT INTO Reviews(Review, Rating, ProductFK, CustomerFK)
//         // OUTPUT inserted.ReviewPK, inserted.Review, inserted.Rating, inserted.CustomerFK
//         // VALUES('${review}','${rating}','${productFK}','${req.customer.CustomerPK}')`

//         // let insertedReview = await db.executeQuery(insertQuery)

//         // console.log(insertedReview)

//         // console.log(req.customer)

//         // res.send("here is your response")}
//     // }
//     // catch(error){
//     //     console.log("error in POST /reviews", error);
//     //     res.status(500).send()
//     // }

// })


app.get("/hi", (req,res)=>{
    res.send('hello world')
})

app.post("/customer/login", async (req,res)=>{
    //  console.log(req.body)
    var email = req.body.email;
    var password = req.body.password;
    if(!email || !password){
        return res.status(400).send('bad request')
    }

    // check user email exisits in db
    var query = `SELECT * 
    FROM customer 
    WHERE email = '${email}'`

    let result;
    try{
        result = await db.executeQuery(query);
    }
    catch(myError){
        console.log("error in /customer/login", myError);
    return res.status(500).send()
    }

    // console.log(result)

    if(!result[0]){
        return res.status(400).send("invalid user credentials")
    }

    // check password match

    let user = result[0]
    if(!bcrypt.compareSync(password, user.Password)){
        console.log("invalid password")
        return res.status(400).send("invalid user credientials")
    }
    

    //generate token

    let token = jwt.sign({pk: user.CustomerPK}, config.JWT, {expiresIn: '60 minutes'})
    console.log(token)

    // save token in db,send token and user info back
    let setTokenQuery = `update Customer
    set token = '${token}'
    where CustomerPK = ${user.CustomerPK}`

    try{    
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                nameFirst: user.nameFirst,
                nameLast: user.nameLast,
                Email: user.Email,
                CustomerPK: user.CustomerPK
                }
            }
        )
    }
    catch(myError){
        console.log("error setting token",myError);
        res.status(500).send()
    }

})

app.post("/customer", async(req,res)=>{
    // res.send("creating user")
    console.log("req body", req.body)
    var nameFirst = req.body.nameFirst;
    var nameLast = req.body.nameLast;
    var email = req.body.email;
    var password = req.body.password;
    if(!nameFirst || !nameLast || !email || !password){
        return res.status(400).send("bad request")
    }

    nameFirst = nameFirst.replace("'","''")
    nameLast = nameLast.replace("'","''")

    var emailCheckQuery = `select email 
    from customer 
    where email = '${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)
    // console.log(existingUser)
    if(existingUser[0]){
        return res.status(409).send('Please enter a different email')}

var hashedPassword = bcrypt.hashSync(password)
var insertQuery = `insert into customer(nameFirst,nameLast,Email,Password)
values('${nameFirst}','${nameLast}','${email}','${hashedPassword}')`

db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send})
    .catch((err)=>{
        console.log("error in POST /customers", err)
    })
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

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})
