require('dotenv').config()
const express = require('express')
const app = express()
const signale = require('signale')

const PORT = process.env.PORT

app.get('*/', (req: any, res: any) => {
    console.log('HI', req)
    res.send('HI')
})

app.listen(PORT, () => signale.success(`Server running on port ${PORT}`))
