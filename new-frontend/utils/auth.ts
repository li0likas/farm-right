import { blob } from "stream/consumers";
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


// ✅ Login function now handles multiple farms and pending invitations
const login = async (accessToken: string): Promise<boolean> => {
    const userData = await fetchUserData(accessToken);

    if (userData) {
        setUser(userData);
        createToken(accessToken);

        // Check for pending invitation
        const pendingInvitation = localStorage.getItem('pendingInvitation');
        if (pendingInvitation) {
            try {
                // Process the invitation
                await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/farm-invitations/${pendingInvitation}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                
                // Clear the pending invitation
                localStorage.removeItem('pendingInvitation');
                
                // Refresh user data to get updated farms
                const refreshedUserData = await fetchUserData(accessToken);
                if (refreshedUserData) {
                    setUser(refreshedUserData);
                }
            } catch (error) {
                console.error('Error processing pending invitation:', error);
            }
        }

        return true;
    }
    return false;
};

// ✅ Handle logout (clears farm selection)
const logout = (): void => {
    removeToken();
    removeUser();
    localStorage.removeItem("x-selected-farm-id");
    console.log("aaaaaa");
    sessionStorage.removeItem("aiInsight");
};

export { isLoggedIn, login, logout };