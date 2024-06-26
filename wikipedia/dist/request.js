"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAPIUrl = exports.returnRestUrl = exports.makeRestRequest = void 0;
const axios_1 = require("axios");
const errors_1 = require("./errors");
let API_URL = 'https://en.wikipedia.org/w/api.php?', REST_API_URL = 'https://en.wikipedia.org/api/rest_v1/';
// RATE_LIMIT = false,
// RATE_LIMIT_MIN_WAIT = undefined,
// RATE_LIMIT_LAST_CALL = undefined,
const USER_AGENT = 'wikipedia (https://github.com/dopecodez/Wikipedia/)';
async function callAPI(url) {
    const options = {
        headers: {
            "Api-User-Agent": USER_AGENT,
        },
    };
    try {
        //console.log(url);
        const { data } = await axios_1.default.get(url, options);
        return data;
    }
    catch (error) {
        console.log(url);
        throw new errors_1.wikiError(error);
    }
}
// Makes a request to legacy php endpoint
async function makeRequest(params, redirect = true) {
    const search = { ...params };
    search['format'] = 'json';
    if (redirect) {
        search['redirects'] = '';
    }
    if (!params.action) {
        search['action'] = "query";
    }
    search['origin'] = '*';
    let searchParam = '';
    Object.keys(search).forEach(key => {
        searchParam += `${key}=${search[key]}&`;
    });
    return await callAPI(API_URL + searchParam);
}
// Makes a request to rest api endpoint
async function makeRestRequest(path, redirect = true) {
    if (!redirect) {
        path += '?redirect=false';
    }
    return await callAPI(REST_API_URL + path);
}
exports.makeRestRequest = makeRestRequest;
//return rest uri
function returnRestUrl(path) {
    return REST_API_URL + path;
}
exports.returnRestUrl = returnRestUrl;
//change language of both urls
function setAPIUrl(prefix) {
    API_URL = 'https://' + prefix.toLowerCase() + '.wikipedia.org/w/api.php?';
    REST_API_URL = 'https://' + prefix.toLowerCase() + '.wikipedia.org/api/rest_v1/';
    return API_URL;
}
exports.setAPIUrl = setAPIUrl;
exports.default = makeRequest;
