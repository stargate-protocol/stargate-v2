try {
    const { configDotenv } = require('dotenv')
    configDotenv({
        path: ['.env.local', '.env'],
    })
} catch (error) {
    console.warn('dotenv not available, ensure environment variables are set manually')
}
