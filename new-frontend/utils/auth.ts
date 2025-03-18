import { createToken, getToken, removeToken } from "../utils/accessToken";
import { setUser, removeUser, getUser } from "../utils/user";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ✅ Fetch user data, including farms
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

// ✅ Check if user is logged in safely
const isLoggedIn = (): boolean => {
    const token = getToken();
    const user = getUser();

    return !!token && Object.keys(user || {}).length !== 0;
};


// ✅ Login function now handles multiple farms
const login = async (accessToken: string): Promise<boolean> => {

    console.log("aa");
    const userData = await fetchUserData(accessToken);

    if (userData) {
        setUser(userData);
        createToken(accessToken);

        return true;
    }
    return false;
};

// ✅ Handle logout (clears farm selection)
const logout = (): void => {
    removeToken();
    removeUser();
    localStorage.removeItem("x-selected-farm-id");
};

export { isLoggedIn, login, logout };
