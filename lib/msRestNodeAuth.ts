// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { ApplicationTokenCredentials } from "./credentials/applicationTokenCredentials";
export { DeviceTokenCredentials } from "./credentials/deviceTokenCredentials";
export { createAuthenticator } from "./credentials/keyVaultFactory";
export { MSIAppServiceOptions, MSIAppServiceTokenCredentials } from "./credentials/msiAppServiceTokenCredentials";
export { MSIOptions, MSITokenCredentials, MSITokenResponse } from "./credentials/msiTokenCredentials";
export { MSIVmOptions, MSIVmTokenCredentials } from "./credentials/msiVmTokenCredentials";
export { TokenCredentialsBase } from "./credentials/tokenCredentialsBase";
export { UserTokenCredentials } from "./credentials/userTokenCredentials";
export { AuthConstants, TokenAudience } from "./util/authConstants";
export { LinkedSubscription, LinkedUser, UserType } from "./subscriptionManagement/subscriptionUtils";
export {
  AuthResponse, LoginWithAuthFileOptions, InteractiveLoginOptions,
  AzureTokenCredentialsOptions, LoginWithUsernamePasswordOptions,
  interactive as interactiveLogin,
  withInteractiveWithAuthResponse as interactiveLoginWithAuthResponse,
  withUsernamePassword as loginWithUsernamePassword,
  withUsernamePasswordWithAuthResponse as loginWithUsernamePasswordWithAuthResponse,
  withServicePrincipalSecret as loginWithServicePrincipalSecret,
  withServicePrincipalSecretWithAuthResponse as loginWithServicePrincipalSecretWithAuthResponse,
  withAuthFile as loginWithAuthFile,
  withAuthFileWithAuthResponse as loginWithAuthFileWithAuthResponse,
  loginWithVmMSI,
  loginWithAppServiceMSI,
} from "./login";
