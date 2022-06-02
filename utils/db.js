import mongoose from 'mongoose'
import logger from '../utils/logger'

export const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
	if (cached.conn) {
		logger.magenta(`Connected to MongoDB at ${MONGODB_URI}`)
		return cached.conn
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		}

		cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
			logger.magenta(`Connected to MongoDB at ${MONGODB_URI}`)
			return mongoose
		})
	}
	cached.conn = await cached.promise
	return cached.conn
}

export const config = {
	api: {
		bodyParser: {
			sizeLimit: '100mb',
			responseLimit: false,
		}
	}
}

export default dbConnect
