const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'ARKA backend running', version: '1.0.0' })
})

app.get('/api/vulnerabilities', (req, res) => {
  res.json([
    { title: 'SQL Injection', severity: 'High', description: 'User input not sanitized' },
    { title: 'XSS Attack', severity: 'Medium', description: 'Unescaped output' }
  ])
})

app.listen(PORT, () => {
  console.log(`Backend available at http://localhost:${PORT}/`)
})
