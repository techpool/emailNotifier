'use strict';
const restify = require('restify'),
    nodemailer = require('nodemailer'),
    Validator = require('jsonschema').Validator,
    v = new Validator();
require('dotenv').config();

/**
 * 
 * Schema defination for the contact form
 *
 * The definition states that:
 * 1. contact email
 * 2. subject
 * 3. message 
 * 4. contact name
 * should be mentioned always and should have a minimum length
 * of 1
 *
 * and also email should have a proper email format else it
 * should fail
 * 
 * @type {Object}
 */
const schemaDefinition = {
    "title": "ContactForm",
    "type": "object",
    "properties": {
        "contactName": {
            "type": "string",
            "minLength": 1
        },
        "contactEmail": {
            "type": "string",
            "format": "email"
        },
        "contactSubject": {
            "type": "string",
            "minLength": 1
        },
        "contactMessage": {
            "type": "string",
            "minLength": 1
        }
    },
    "required": ["contactEmail", "contactMessage", "contactSubject", "contactName"]
}


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
    }
});


/**
 *
 * Sends an email to the admin
 * 
 * @param  {Object}   req  Request Object (express request object)
 * @param  {Object}   res  Response Object (express response object)
 * @param  {Function} next Express next middleware calling function
 */
function respondWithEmail(req, res, next) {

    const validationResult = v.validate(req.body, schemaDefinition);
    if (validationResult.errors.length > 0) {
        res.send(validationResult.errors);
        return;
    }

    // setup email data with unicode symbols
    let mailOptions = {
        from: req.body.contactName + ' <suryadeep10@gmail.com>', // sender address
        to: process.env.TO_EMAILS, // list of receivers
        subject: req.body.contactSubject, // Subject line
        text: req.body.contactMessage + ' Email: ' + req.body.contactEmail, // plain text body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send(error);
            return;
        }
        res.send({
            messageId: info.messageId,
            response: info.response,
            OK: true
        });
    });
}


/**
 * 
 * Function to allow cross origin support
 * 
 * @param  {Object}   req  Request Object (express request object)
 * @param  {Object}   res  Response Object (express response object)
 * @param  {Function} next Express next middleware calling function
 */
function crossOrigin(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
}

var server = restify.createServer();
server.use(crossOrigin);
server.use(restify.bodyParser({ mapParams: false }));
server.post('/contact', respondWithEmail);

server.listen(process.env.PORT || 8000, function () {
    console.log('%s listening at %s', server.name, server.url);
});
