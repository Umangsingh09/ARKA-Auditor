import axios from "axios"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000"
})

export const scanStart = (payload) => API.post("/scan/start", payload)

export const getMockPrs = () => API.get("/pr/mock")

export default API