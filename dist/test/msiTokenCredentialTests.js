"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const should = require("should");
const nock = require("nock");
const msRestNodeAuth_1 = require("../lib/msRestNodeAuth");
describe('MSI Authentication', function () {
    before(function (done) {
        done();
    });
    after(function (done) {
        done();
    });
    beforeEach(function (done) {
        done();
    });
    afterEach(function (done) {
        done();
    });
    function setupNockResponse(port, requestBodyToMatch, response, error) {
        if (!port) {
            port = 50342;
        }
        let basePath = `http://localhost:${port}`;
        let interceptor = nock(basePath).post("/oauth2/token", function (body) {
            return JSON.stringify(body) === JSON.stringify(requestBodyToMatch);
        });
        if (!error) {
            interceptor.reply(200, response);
        }
        else {
            interceptor.replyWithError(error);
        }
    }
    it('should get token from the virtual machine with MSI service running at default port', function (done) {
        let response = {
            access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d',
            refresh_token: '',
            expires_in: '3599',
            expires_on: '1502930996',
            not_before: '1502927096',
            resource: 'https://management.azure.com/',
            token_type: 'Bearer'
        };
        let requestBodyToMatch = `resource=https%3A%2F%2Fmanagement.azure.com%2F`;
        setupNockResponse(null, requestBodyToMatch, response);
        let msiCredsObj = new msRestNodeAuth_1.MSITokenCredentials();
        msiCredsObj.getToken().then((response) => {
            should.exist(response);
            should.exist(response.access_token);
            should.exist(response.token_type);
            done();
        }).catch((err) => { done(err); });
    });
    it('should get token from the virtual machine with MSI service running at custom port', function (done) {
        let response = {
            access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1d',
            refresh_token: '',
            expires_in: '3599',
            expires_on: '1502930996',
            not_before: '1502927096',
            resource: 'https://management.azure.com/',
            token_type: 'Bearer'
        };
        let requestBodyToMatch = `resource=https%3A%2F%2Fmanagement.azure.com%2F`;
        let customPort = 50341;
        setupNockResponse(customPort, requestBodyToMatch, response);
        let msiCredsObj = new msRestNodeAuth_1.MSITokenCredentials(customPort);
        msiCredsObj.getToken().then((response) => {
            should.exist(response);
            should.exist(response.access_token);
            should.exist(response.token_type);
            done();
        }).catch((err) => { done(err); });
    });
    it('should throw on requests with bad resource', function (done) {
        let errorResponse = {
            "error": "unkwnown",
            "error_description": "Failed to retrieve token from the Active directory. For details see logs in C:\\User1\\Logs\\Plugins\\Microsoft.Identity.MSI\\1.0\\service_identity_0.log"
        };
        let requestBodyToMatch = `resource=badvalue`;
        setupNockResponse(null, requestBodyToMatch, null, errorResponse);
        let msiCredsObj = new msRestNodeAuth_1.MSITokenCredentials(undefined, "badvalue");
        msiCredsObj.getToken().catch((err) => {
            should.exist(err);
            done();
        });
    });
    it('should throw on request with empty resource', function (done) {
        let errorResponse = { "error": "bad_resource_200", "error_description": "Invalid Resource" };
        let requestBodyToMatch = `resource=%20%20`;
        setupNockResponse(null, requestBodyToMatch, null, errorResponse);
        let msiCredsObj = new msRestNodeAuth_1.MSITokenCredentials(undefined, "  ");
        msiCredsObj.getToken().catch((err) => {
            should.exist(err);
            done();
        });
    });
});
//# sourceMappingURL=msiTokenCredentialTests.js.map