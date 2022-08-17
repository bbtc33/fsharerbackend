const express = require('express')
const multer = require('multer')
const cors = require('cors')
const knex = require('knex')
const fs = require('fs')
const dotenv = require('dotenv').config()

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
		cb(null, './storage')
	},
	filename: function (req, file, cb) {
		const time = Date.now() % 100000000
		const b36time = time.toString(36)
		const extensionarray = file.originalname.split(".")
		const extension = extensionarray[extensionarray.length - 1]
		response = b36time + '.' + extension
		postgres('files').insert({
			filename: response,
			timemillis: time,
		}).then()
		cb(null, response)
	}
})



const upload = multer({storage: storage})
const app = express();

app.use(cors());
app.use(express.static('storage'));


app.get('/', (req, res) => {
	res.send("API is up and running")
})

app.post('/uploadtext', upload.none(), (req, res, next) => {

	const filename = function (req, file, cb) {
		const time = Date.now() % 100000000
		const b36time = time.toString(36)
		response = b36time + '.txt'
		postgres('files').insert({
			filename: response,
			timemillis: time,
		}).then()
		return response
	}

	fs.appendFile( './storage/' + filename(), req.body.chosenFile, () => {})

	const modtime = Date.now() % 100000000;
	const min = () => {
		if (modtime < 43200000){
		return modtime - 43200000 + 99999999
		}else {
		return modtime - 43200000
		}
	}

	let valid;

	if (min() < modtime){
		postgres('files')
			.select('filename')
			.from('files')
			.whereNotBetween('timemillis', ([min(),modtime]))
			.then(valid => {
				valid.map(function(entry) {
					fs.unlink('./storage/' + entry.filename, () => {})
				})
			})
		postgres('files')
			.delete()
			.whereNotBetween('timemillis', ([min(),modtime]))
			.then()
	}else {
		postgres('files')
			.select('filename')
			.from('files')
			.whereBetween('timemillis', ([min(),modtime]))
			.then(valid => {
				valid.map(function(entry) {
					fs.unlink('./storage/' + entry.filename, () => {})
				})
			})
		postgres('files')
			.delete()
			.whereBetween('timemillis',([min(),modtime]))
			.then()
	}

	const resObject = {link: response}

	res.json(resObject)

})
app.post('/upload', upload.single('chosenFile'), (req, res, next) => {
	const modtime = Date.now() % 100000000;
	const min = () => {
		if (modtime < 43200000){
		return modtime - 43200000 + 99999999
		}else {
		return modtime - 43200000
		}
	}

	let valid;

	if (min() < modtime){
		postgres('files')
			.select('filename')
			.from('files')
			.whereNotBetween('timemillis', ([min(),modtime]))
			.then(valid => {
				valid.map(function(entry) {
					fs.unlink('./storage/' + entry.filename, () => {})
				})
			})
		postgres('files')
			.delete()
			.whereNotBetween('timemillis', ([min(),modtime]))
			.then()
	}else {
		postgres('files')
			.select('filename')
			.from('files')
			.whereBetween('timemillis', ([min(),modtime]))
			.then(valid => {
				valid.map(function(entry) {
					fs.unlink('./storage/' + entry.filename, () => {})
				})
			})
		postgres('files')
			.delete()
			.whereBetween('timemillis',([min(),modtime]))
			.then()
	}

	const resObject = {link: response}

	res.json(resObject)
})

app.listen(process.env.PORT);
