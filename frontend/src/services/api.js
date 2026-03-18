import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5000", // your backend
})

export default API