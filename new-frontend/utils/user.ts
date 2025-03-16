interface Farm {
    farmId: number;
    farmName: string;
    role: string;
}

interface User {
    id: string;
    username: string;
    email: string;
    farms: Farm[]; // Ensure farms property is included
    [key: string]: any; // Allows additional user properties
}

export const setUser = (userData: User): void => {
    if (!userData) {
        console.error("Attempted to store invalid user data:", userData);
        return;
    }
    localStorage.setItem('user', JSON.stringify(userData));
};

export const updateUser = (userData: User): void => {
    removeUser();
    setUser(userData);
};

// 🔥 Fix: Ensure this always returns an object, not null/undefined
export const getUser = (): User => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : {}; // Return empty object instead of null
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        return {}; // Always return an empty object on error
    }
};

export const removeUser = (): void => {
    localStorage.removeItem('user');
};
