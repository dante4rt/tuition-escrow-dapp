import React from "react";

export interface AppContextType {
    isAdmin: boolean;
    isLoadingAdminStatus: boolean;
}

export const AppAdminContext = React.createContext<AppContextType>({
    isAdmin: false,
    isLoadingAdminStatus: true,
});
