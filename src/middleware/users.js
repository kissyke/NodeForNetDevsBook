'use strict';

const uuid = require('uuid');

module.exports = (req, res, next ) => {
    let userId = req.cookies.userId;
    if(!userId) {
        userId = uuid.v4();
        res.cookie('userId', userId);
    }
    req.user = {
        id: userId
    };
    next();
};