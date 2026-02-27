const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const CHAT_BACKEND_URL = "https://sreecharan-desu-arthikbackend.hf.space";

export const apiService = {
    async fetchUser(token: string) {
        const response = await fetch(`${BACKEND_URL}/user/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch user");
        return response.json();
    },

    async changePassword(token: string, data: any) {
        const response = await fetch(`${BACKEND_URL}/user/password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return response;
    },

    async fetchBookings(token: string) {
        const response = await fetch(`${BACKEND_URL}/user/bookings`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch bookings");
        return response.json();
    },

    async chat(token: string, message: string) {
        const response = await fetch(`${CHAT_BACKEND_URL}/agent/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        if (!response.ok) throw new Error("Failed to connect to AI agent");
        return response;
    }
};
