import ReactDOM from "react-dom/client";
import React from "react";
import { AppWrapper } from "./components/AppWrapper.tsx";
import "./_css/main.scss";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(AppWrapper));