import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux"; // Thêm Provider
import { store } from "./store"; // Import store
import "./index.css";
import router from "./routes/router";
import "antd/dist/reset.css";
import { loginSuccess } from "./store/userSlice";
// Khôi phục trạng thái user từ localStorage khi khởi động
const userFromStorage = localStorage.getItem("user");
if (userFromStorage) {
  const user = JSON.parse(userFromStorage);
  store.dispatch(loginSuccess({ username: user.username, role: user.role }));
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);