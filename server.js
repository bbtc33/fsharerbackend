const express = require('express')
const multer = require('multer')
const cors = require('cors')
const knex = require('knex')
const fs = require('fs')
const dotenv = require('dotenv').config()
const cron = require('node-cron')

const postgres = knex({
	client: 'pg',
	connection: {
		host : process.env.DB_HOST,
		user : process.env.DB_USER,
		password : process.env.DB_PASS,
		database : process.env.DB_NAME,
	}
})

let response;

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, process.env.STORAGE_LOC)
	},
	filename: function (req, file, cb) {
		const time = Date.now() % 86400000
		const day = Math.floor(Date.now() / 86400000)
		const b36time = time.toString(36)
		const extensionarray = file.originalname.split(".")
		const extension = extensionarray[extensionarray.length - 1]
		response = b36time + "." + extension
		postgres('files').insert({
			filename: response,
			timemillis: time,
			date: day,
		}).then()

		cb(null, response)
	}
})



const upload = multer({storage: storage})
const app = express();

app.use(cors());
app.use(express.static(process.env.STORAGE_LOC));

// deletion schedule
cron.schedule('0 0 * * *',() => {

	console.log("hey guys")
	const currentDate = Math.floor(Date.now() / 86400000);

	postgres('files')
		.select('filename')
		.from('files')
		.where('date', '<', currentDate - 1)
		.then((names) => {
			for (var i = 0; i < names.length; i++) {
				var item = names[i]
				console.log('Name:', item.filename)
				fs.unlink(process.env.STORAGE_LOC + item.filename, () => {})
			}
			postgres('files')
			.select('filename')
			.from('files')
			.where('date', '<', currentDate - 1)
			.del()
			.then()
		})
})


app.get('/', (req, res) => {
	res.send("API is up and running")
})

app.post('/uploadtext', upload.none(), (req, res, next) => {

	const filename = function (req, file, cb) {
		const time = Date.now() % 86400000
		const day = Math.floor(Date.now() / 86400000)
		const b36time = time.toString(36)
		response = b36time + '.txt'
		postgres('files').insert({
			filename: response,
			timemillis: time,
			date: day,
		}).then()
		return response
	}

	fs.appendFile( process.env.STORAGE_LOC + filename(), req.body.chosenFile, () => {})
	const resObject = {link: response}

	res.json(resObject)

})
app.post('/upload', upload.single('chosenFile'), (req, res, next) => {
	const resObject = {link: response}

	res.json(resObject)
})

app.listen(process.env.PORT);
