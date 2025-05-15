interface Farm {
    farmId: number;
    farmName: string;
    role: string;
}

interface User {
    id: string;
    username: string;
    email: string;
    farms: Farm[]; 
    [key: string]: any;
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

export const getUser = (): User => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : {
            id: '',
            username: '',
            email: '',
            farms: []
        };
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        return {
            id: '',
            username: '',
            email: '',
            farms: []
        };
    }
};

export const removeUser = (): void => {
    localStorage.removeItem('user');
};
