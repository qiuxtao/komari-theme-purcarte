export const useAccount = () => { return { account: { logged_in: true }, role: "admin" }; };
export const AccountProvider = ({children}: any) => children;