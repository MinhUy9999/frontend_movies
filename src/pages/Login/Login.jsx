import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../apis/userApi";
import { Link } from "react-router-dom";
import { loginSuccess } from "../../store/userSlice";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
    
        const credentials = { email, password };
        const response = await userApi.login(credentials);
        console.log("Login response:", response);
    
        if (response.statusCode === 200) {
            const { accessToken, user } = response.content;
            if (user && user.username && user.role) {
                const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
                const userId = tokenPayload.id;
                
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("userId", userId); 
                localStorage.setItem("userRole", user.role);
                localStorage.setItem("user", JSON.stringify({ 
                    username: user.username, 
                    role: user.role,
                    id: userId 
                }));
        
                dispatch(loginSuccess({ 
                    username: user.username, 
                    role: user.role,
                    id: userId
                }));
                
                setMessage(`Login successful! Welcome, ${user.username}`);
                setTimeout(() => navigate("/"), 2000);
            } else {
                setMessage("Login successful, but user data is incomplete.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full p-6 border border-gray-300 rounded-lg shadow-md bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Login
                    </button>
                </form>
                {message && (
                    <p
                        className={`mt-4 text-center ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}
                    >
                        {message}
                    </p>
                )}
                <p className="mt-4 text-center">
                    Don’t have an account?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;