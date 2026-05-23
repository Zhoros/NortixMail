"use strict";
import express from 'express'
import compression from 'compression'
import config from './config.js'

let mod = {

	start: function(db, domainName, port){

		const app = express();

		app.use(express.json());
		app.use(compression());
		app.use(express.static('./public'));

		let refreshInterval = config.getConfig("MailRefreshInterval");
		app.post('/addresses', (_req, res) => {

			try {

				let rows = db.prepare("SELECT addr FROM address").all();
				res.json({addresses: rows, refreshInterval: refreshInterval});

			} catch(err) {

				console.log("DB get addresses fail")
				console.log(err)

			}

		})

		app.post('/domain', (req, res) => {

			if (domainName){

				return res.status(200).send(domainName);

			}else{

				return res.status(200).send(req.headers.host.split(':')[0]);

			}

		})

		app.post('/addAddress', (req, res) => {
		
			const json = req.body;
			
			try {

				let rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(json.address);
				if(rows.length > 0){
					
					return res.status(200).send("exist");

				}

				db.prepare("INSERT INTO address (addr) VALUES (?)").run(json.address);
				return res.status(200).send("done");

			} catch(err) {

				console.log("DB add addresses fail")
				console.log(err)

			}

		})

		app.post('/deleteAddress', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM address WHERE addr = ?").run(json.address);
				db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);

				return res.status(200).send("done");

			} catch(err) {

				console.log("DB delete address fail")
				console.log(err)

			}

		})

		app.post('/deleteEmails', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);
				return res.status(200).send("done");

			} catch(err) {

				console.log("DB delete address fail")
				console.log(err)

			}

		})



		app.post('/mails', (req, res) => {

			const json = req.body;

			try {

				let rows = db.prepare("SELECT id, sender, subject FROM mail WHERE recipient = @recipient ORDER BY id DESC LIMIT @mailCount OFFSET (@page-1)*@mailCount").all({recipient: json.addr, page: json.page, mailCount: config.getConfig('MailCountPerPage')});
				res.json(rows);

			} catch(err) {

				console.log("DB get mails fail")
				console.log(err)

			}

		});

		app.post('/mailData', (req, res) => {

			const json = req.body;

			try {

				let rows = db.prepare("SELECT sender, subject, content FROM mail WHERE id = ?").all(json.id);
				res.json(rows[0])

			} catch(err) {

				console.log("DB get mail data fail")
				console.log(err)

			}

		});

		app.post('/deleteMail', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM mail WHERE id = ?").run(json.id);
				res.status(200).send();

			} catch(err) {

				console.log("DB delete mail fail")
				console.log(err)

			}

		})

		app.use((err, req, res, next) => {
			console.error(err)
		});

		app.listen(port, () => {
			console.log('http server listening at port: ' + port);	
		})
		
	}

}


export default mod;
