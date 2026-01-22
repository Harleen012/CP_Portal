// import { Configuration } from "@azure/msal-browser";

// export const msalConfig: Configuration = {
//   auth: {
//     clientId: "392884bf-45f4-456c-93f8-3189eca406b4",
//     authority: "https://login.microsoftonline.com/4dab0fef-f02d-440b-97c3-712e9483bd68",
//     redirectUri: "http://localhost:3000/login",
//   },
//   cache: {
//     cacheLocation: "sessionStorage",
//     storeAuthStateInCookie: false,
//   },
// };

// export const loginRequest = {
//   scopes: [
//     "User.Read",
//     "Sites.Manage.All",
//     "openid",
//     "offline_access"
//   ],
// };







// lib/msalConfig.ts

import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "392884bf-45f4-456c-93f8-3189eca406b4",  // Your actual client ID
    authority: "https://login.microsoftonline.com/4dab0fef-f02d-440b-97c3-712e9483bd68",  // Your tenant ID
    redirectUri: "http://localhost:3000/login",  // URI for handling the redirect after login
  },
  cache: {
    cacheLocation: "sessionStorage",  // Store authentication state in sessionStorage
    storeAuthStateInCookie: false,  // Don't store auth state in cookies (can set to true for compatibility with IE)
  },
};

export const loginRequest = {
  scopes: [
    "Files.Read",             // Permission to read user files
    "Files.ReadWrite",        // Permission for full access to user files
    "offline_access",         // Permission to maintain access to data offline
    "openid",                 // OpenID authentication
    "Sites.Manage.All",       // Permission to manage SharePoint sites
    "Sites.Selected",         // Permission to access specific SharePoint sites
    "User.Read",              // Permission to read user profile
    "User.ReadBasic.All",     // Permission to read all users' basic profiles
  ],
};