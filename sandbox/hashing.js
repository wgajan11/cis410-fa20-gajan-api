const bcrypt = require('bcryptjs')

var hashedpassword = bcrypt.hasSync('asdfasdf')
console.log(hashedpassword)
var hastTest = bcrypt.compareSync("asdfasdf",hashedpassword)
console.log(hasedtest)