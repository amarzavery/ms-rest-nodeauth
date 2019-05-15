// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Constants as MSRestConstants, WebResource } from "@azure/ms-rest-js";
import { TokenClientCredentials } from "./tokenClientCredentials";
import { TokenResponse } from "adal-node";
import { LinkedSubscription } from "../subscriptionManagement/subscriptionUtils";
import { execAz } from "../login";

/**
 * @interface CliAccessToken
 * Describes the access token retrieved from Azure CLI.
 */
export interface CliAccessToken {
  /**
   * The access token for the resource
   */
  accessToken: string;
  /**
   * Time when the access token expires.
   */
  expiresOn: Date;
  /**
   * SubscriptionId associated with the token.
   */
  subscription: string;
  /**
   * tenantId associated with the token.
   */
  tenant: string;
  /**
   * The token type. example: "Bearer".
   */
  tokenType: string;
}

/**
 * @interface ListAllSubscriptionOptions
 * Describes the options that can be provided while listing all the subscriptions/accounts via
 * Azure CLI.
 */
export interface ListAllSubscriptionOptions {
  /**
   * List all subscriptions, rather just 'Enabled' ones.
   */
  all?: boolean;
  /**
   * Retrieve up-to-date subscriptions from server.
   */
  refresh?: boolean;
}

/**
 * @class AzureCliCredentials
 * Describes the credentials by retrieving token via Azure CLI.
 */
export class AzureCliCredentials implements TokenClientCredentials {
  /**
   * Provides information about the default/current subscription for Azure CLI.
   */
  subscriptionInfo: LinkedSubscription;
  /**
   * Provides information about the access token for the corresponding subscription for Azure CLI.
   */
  tokenInfo: CliAccessToken;
  /**
   * The number of seconds within which it is good to renew the token.
   *  A constant set to 270 seconds (4.5 minutes).
   */
  readonly tokenRenewalMarginInSeconds: number = 270;

  constructor(subscriptinInfo: LinkedSubscription, tokenInfo: CliAccessToken) {
    this.subscriptionInfo = subscriptinInfo;
    this.tokenInfo = tokenInfo;
  }

  /**
   * Tries to get the token from cache initially. If that is unsuccessful then it tries
   * to get the token from ADAL.
   * @returns {Promise<TokenResponse>} The tokenResponse (tokenType and accessToken are the two
   * important properties).
   */
  public async getToken(): Promise<TokenResponse> {
    const now = Math.floor(Date.now() / 1000);
    // we refresh the token if the user changed the subscription against which they want to work
    // or if the token is in the renewal window (close to getting expired).
    if (
      !this.tokenInfo.expiresOn ||
      this.subscriptionInfo.id !== this.tokenInfo.subscription ||
      Math.floor(this.tokenInfo.expiresOn.getTime() / 1000) - now <
      this.tokenRenewalMarginInSeconds
    ) {
      try {
        // refresh the access token
        this.tokenInfo = await AzureCliCredentials.getAccessToken(
          this.subscriptionInfo.id
        );
      } catch (err) {
        throw new Error(
          `An error occurred while refreshing the new access ` +
          `token:${err.stderr ? err.stderr : err.message}`
        );
      }
    }
    const result: any = {};
    result.accessToken = this.tokenInfo.accessToken;
    result.tokenType = this.tokenInfo.tokenType;
    return result;
  }

  /**
   * Signs a request with the Authentication header.
   *
   * @param The request to be signed.
   * @return Promise<WebResource>
   */
  public async signRequest(webResource: WebResource): Promise<WebResource> {
    const tokenResponse = await this.getToken();
    webResource.headers.set(
      MSRestConstants.HeaderConstants.AUTHORIZATION,
      `${tokenResponse.tokenType} ${tokenResponse.accessToken}`
    );
    return Promise.resolve(webResource);
  }

  /**
   * Gets the access token for the default or specified subscription.
   * @param subscriptionIdOrName The subscription id or name for which the access token is required.
   */
  static async getAccessToken(subscriptionIdOrName?: string): Promise<CliAccessToken> {
    try {
      let cmd = "account get-access-token";
      if (subscriptionIdOrName) {
        cmd += ` -s "${subscriptionIdOrName}"`;
      }
      const result: any = await execAz(cmd);
      result.expiresOn = new Date(result.expiresOn);
      return result as CliAccessToken;
    } catch (err) {
      const message =
        `An error occurred while getting credentials from ` +
        `Azure CLI: ${err.stack}`;
      throw new Error(message);
    }
  }

  /**
   * Gets the default subscription from Azure CLI.
   */
  static async getDefaultSubscription(): Promise<LinkedSubscription> {
    try {
      const result: LinkedSubscription = await execAz("account show");
      return result;
    } catch (err) {
      const message =
        `An error occurred while getting information about the current subscription from ` +
        `Azure CLI: ${err.stack}`;
      throw new Error(message);
    }
  }

  /**
   * Sets the specified subscription as the default subscription for Azure CLI.
   * @param subscriptionIdOrName The name or id of the subsciption that needs to be set as the
   * default subscription.
   */
  static async setDefaultSubscription(subscriptionIdOrName: string): Promise<void> {
    try {
      await execAz(`account set -s ${subscriptionIdOrName}`);
    } catch (err) {
      const message =
        `An error occurred while setting the current subscription from ` +
        `Azure CLI: ${err.stack}`;
      throw new Error(message);
    }
  }

  /**
   * Returns a list of all the subscriptions from Azure CLI.
   * @param options Optional parameters that can be provided while listing all the subcriptions.
   */
  static async listAllSubscriptions(options?: ListAllSubscriptionOptions): Promise<LinkedSubscription[]> {
    if (!options) options = {};
    let subscriptionList: any[] = [];
    try {
      let cmd = "account list";
      if (options.all) {
        cmd += " --all";
      }
      if (options.refresh) {
        cmd += "--refresh";
      }
      subscriptionList = await execAz(cmd);
      if (subscriptionList && subscriptionList.length) {
        for (const sub of subscriptionList) {
          if (sub.cloudName) {
            sub.environmentName = sub.cloudName;
            delete sub.cloudName;
          }
        }
      }
      return subscriptionList;
    } catch (err) {
      const message =
        `An error occurred while getting a list of all the subscription from ` +
        `Azure CLI: ${err.stack}`;
      throw new Error(message);
    }
  }

  /**
   * Provides credentials that can be used by the JS SDK to interact with Azure via azure cli.
   * **Pre-requisite**
   * - **install azure-cli** . For more information see
   * {@link https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest Install Azure CLI}
   * - **login via `az login`**
   * - If you want to work against a specific subscription then please set that subscription as
   * the default subscription by executing `az account set -s <subscriptionNameOrId>`
   */
  static async create(): Promise<AzureCliCredentials> {
    const [subscriptinInfo, accessToken] = await Promise.all([
      AzureCliCredentials.getDefaultSubscription(),
      AzureCliCredentials.getAccessToken()
    ]);
    return new AzureCliCredentials(subscriptinInfo, accessToken);
  }
}