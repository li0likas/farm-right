export const createToken = (token: string): void => {
    localStorage.setItem('accessToken', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

export const removeToken = (): void => {
    localStorage.removeItem('accessToken');
};
