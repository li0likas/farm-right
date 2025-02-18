import { createToken, getToken, removeToken } from "../utils/accessToken";
import { setUser, removeUser, getUser } from "../utils/user";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchUserData = async (accessToken: string) => {
    try {
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return data;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

const isLoggedIn = (): boolean => {
    return !!getToken() && Object.keys(getUser()).length !== 0;
};

const login = async (accessToken: string): Promise<boolean> => {
    const userData = await fetchUserData(accessToken);
    if (userData) {
        setUser(userData);
        createToken(accessToken);
        return true;
    }
    return false;
};

const logout = (): void => {
    removeToken();
    removeUser();
};

export { isLoggedIn, login, logout };
