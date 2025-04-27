export const createToken = (token: string, rememberMe: boolean = false): void => {
    if (rememberMe) {
        localStorage.setItem('accessToken', token);
    } else {
        sessionStorage.setItem('accessToken', token);
    }
};

export const getToken = (): string | null => {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
};
export const removeToken = (): void => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
};