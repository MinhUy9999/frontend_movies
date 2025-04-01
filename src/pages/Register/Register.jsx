import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/userSlice";
import { userApi } from "../../apis/userApi";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        gender: "",
        phone: "",
        dateofbirth: "",
    });
    const [message, setMessage] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const date = new Date(formData.dateofbirth);
        const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;

        const dataToSubmit = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            gender: formData.gender,
            phone: formData.phone,
            dateofbirth: formattedDate,
        };

        const response = await userApi.register(dataToSubmit);
        console.log("Register response:", response); // Debug response

        if (response.statusCode === 201) {
            const { accessToken, user } = response.content;
            if (user && user.username && user.role) { // Kiểm tra dữ liệu
                localStorage.setItem("accessToken", accessToken);
                dispatch(loginSuccess({ username: user.username, role: user.role }));
                setMessage(`Registration successful! Welcome, ${user.username}`);
                setFormData({
                    username: "",
                    email: "",
                    password: "",
                    gender: "",
                    phone: "",
                    dateofbirth: "",
                });
                setTimeout(() => navigate("/"), 2000);
            } else {
                setMessage("Registration successful, but user data is incomplete.");
            }
        } else {
            setMessage(response.message || "Registration failed.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full p-6 border border-gray-300 rounded-lg shadow-md bg-white">
                <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Username:</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Gender:</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Phone:</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="mb-1 text-gray-700">Date of Birth:</label>
                        <input
                            type="date"
                            name="dateofbirth"
                            value={formData.dateofbirth}
                            onChange={handleChange}
                            required
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Register
                    </button>
                </form>
                {message && (
                    <p
                        className={`mt-4 text-center ${message.includes("successful") ? "text-green-500" : "text-red-500"
                            }`}
                    >
                        {message}
                    </p>
                )}
                <p className="mt-4 text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;