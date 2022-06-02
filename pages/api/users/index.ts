import type { NextApiRequest, NextApiResponse } from 'next'
import { IUser, User } from '../../../models/user.model'
import dbConnect from '../../../utils/db'
import { withSentry } from '@sentry/nextjs'

export type CreateUserPayload = {
	address: string
	displayName: string
	avatarUrl: string
	projectIds: string[]
	stemIds: string[]
	nftIds: string[]
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { method } = req
	await dbConnect()

	switch (method) {
		case 'GET':
			try {
				/* find all the data in our database */
				const users: IUser[] = await User.find({})
				res.status(200).json({ success: true, data: users })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break
		case 'POST':
			try {
				const accountAddress = req.body.address.toLowerCase()
				// Genearate a Robohash.org avatar - https://robohash.org
				const baseURL = 'https://robohash.org/'
				let avatarUrl = baseURL
				avatarUrl += accountAddress // Use unique hash based off address
				avatarUrl += '?set=set1' // Use Robots type
				avatarUrl += '&bgset=bg1' // Add random background
				avatarUrl += '&size=300x300' // Make 300x300 size
				const payload: CreateUserPayload = {
					address: accountAddress,
					displayName: accountAddress,
					avatarUrl,
					projectIds: [],
					stemIds: [],
					nftIds: [],
				}

				/* create a new model in the database */
				const user: IUser = await User.create(payload)

				res.status(201).json({ success: true, data: user })
			} catch (e: any) {
				res.status(400).json({ success: false, error: e.message })
			}
			break
		default:
			res.status(400).json({ success: false, error: `HTTP method '${method}' not supported` })
			break
	}
}

export default withSentry(handler)
