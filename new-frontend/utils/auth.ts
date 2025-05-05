import { createToken, getToken, removeToken } from "../utils/accessToken";
import { setUser, removeUser, getUser } from "../utils/user";
import api from "@/utils/api";

const fetchUserData = async (accessToken: string) => {
    try {
        const { data } = await api.get(`/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

const isLoggedIn = (): boolean => {
    const token = getToken();
    const user = getUser();

    return !!token && Object.keys(user || {}).length !== 0;
};

const login = async (accessToken: string, rememberMe: boolean = false): Promise<boolean> => {
    const userData = await fetchUserData(accessToken);

    if (userData) {
        setUser(userData);
        
        createToken(accessToken, rememberMe);
        
        return true;
    }
    return false;
};

const logout = (): void => {
    removeToken();
    removeUser();
    localStorage.removeItem("x-selected-farm-id");
    sessionStorage.removeItem("aiInsight");
};

export { isLoggedIn, login, logout };
