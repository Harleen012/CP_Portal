import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "392884bf-45f4-456c-93f8-3189eca406b4",
    authority: "https://login.microsoftonline.com/4dab0fef-f02d-440b-97c3-712e9483bd68",
    redirectUri: "http://localhost:3000/login",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "Sites.Manage.All",
    "openid",
    "offline_access"
  ],
};
