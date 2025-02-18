interface User {
    id: string;
    username: string;
    email: string;
    [key: string]: any; // Allows additional user properties
}

export const setUser = (userData: User): void => {
    localStorage.setItem('user', JSON.stringify(userData));
};

export const updateUser = (userData: User): void => {
    removeUser();
    setUser(userData);
};

export const getUser = (): User | {} => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : {};
};

export const removeUser = (): void => {
    localStorage.removeItem('user');
};
