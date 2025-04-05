import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux"; 
import { store } from "./store"; 
import "./index.css";
import router from "./routes/router";
import "antd/dist/reset.css";
import { loginSuccess } from "./store/userSlice";
import { SocketProvider } from "./contexts/WebSocketContext";

const userFromStorage = localStorage.getItem("user");
if (userFromStorage) {
  const user = JSON.parse(userFromStorage);
  store.dispatch(loginSuccess({ username: user.username, role: user.role }));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </Provider>
  </React.StrictMode>
);