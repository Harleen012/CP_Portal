// "use client"

// import { MsalProvider } from "@azure/msal-react"
// import { PublicClientApplication } from "@azure/msal-browser"
// import { msalConfig } from "@/lib/msalConfig"

// const msalInstance = new PublicClientApplication(msalConfig)

// export default function MsalWrapper({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <MsalProvider instance={msalInstance}>
//       {children}
//     </MsalProvider>
//   )
// }






"use client";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "@/lib/msalConfig";  // Correctly import the config

const msalInstance = new PublicClientApplication(msalConfig);

export default function MsalWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
