"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const msRest = require("ms-rest-js");
/**
 * @class MSITokenCredentials - Provides information about managed service identity token credentials.
 * This object can only be used to acquire token on a virtual machine provisioned in Azure with managed service identity.
 */
class MSITokenCredentials {
    constructor(
        /**
         * @property {number} port - Port on which the MSI service is running on the host VM. Default port is 50342
         */
        port = 50342, 
        /**
         * @property {string} resource - The resource uri or token audience for which the token is needed.
         * For e.g. it can be:
         * - resourcemanagement endpoint "https://management.azure.com/"(default)
         * - management endpoint "https://management.core.windows.net/"
         */
        resource = "https://management.azure.com/") {
        this.port = port;
        this.resource = resource;
        if (typeof port.valueOf() !== "number") {
            throw new Error("port must be a number.");
        }
        if (typeof resource.valueOf() !== "string") {
            throw new Error("resource must be a uri of type string.");
        }
        this.port = port;
        this.resource = resource;
    }
    /**
     * Prepares and sends a POST request to a service endpoint hosted on the Azure VM, which responds with the access token.
     * @param  {function} callback  The callback in the form (err, result)
     * @return {function} callback
     *                       {Error} [err]  The error if any
     *                       {object} [tokenResponse] The tokenResponse (token_type and access_token are the two important properties).
     */
    getToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const reqOptions = this.prepareRequestOptions();
            const client = new msRest.ServiceClient();
            let opRes;
            let result;
            try {
                opRes = yield client.sendRequest(reqOptions);
                result = opRes.bodyAsJson;
                if (!result.token_type) {
                    throw new Error(`Invalid token response, did not find token_type. Response body is: ${opRes.bodyAsText}`);
                }
                else if (!result.access_token) {
                    throw new Error(`Invalid token response, did not find access_token. Response body is: ${opRes.bodyAsText}`);
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
            return Promise.resolve(result);
        });
    }
    prepareRequestOptions() {
        const resource = encodeURIComponent(this.resource);
        const reqOptions = {
            url: `http://localhost:${this.port}/oauth2/token`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Metadata": "true"
            },
            body: `resource=${resource}`,
            method: "POST"
        };
        return reqOptions;
    }
    /**
     * Signs a request with the Authentication header.
     *
     * @param {webResource} The WebResource to be signed.
     * @param {function(error)}  callback  The callback function.
     * @return {undefined}
     */
    signRequest(webResource) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenResponse = yield this.getToken();
            webResource.headers[msRest.Constants.HeaderConstants.AUTHORIZATION] = `${tokenResponse.token_type} ${tokenResponse.access_token}`;
            return Promise.resolve(webResource);
        });
    }
}
exports.MSITokenCredentials = MSITokenCredentials;
//# sourceMappingURL=msiTokenCredentials.js.map