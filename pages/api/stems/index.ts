import type { NextApiRequest, NextApiResponse } from 'next'
import type { IStemDoc } from '../../../models/stem.model'
import { Stem } from '../../../models/stem.model'
import dbConnect from '../../../utils/db'
import { update } from '../../../utils/http'
import { withSentry } from '@sentry/nextjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { body, method } = req
	await dbConnect()

	switch (method) {
		case 'GET':
			try {
				/* find all the data in our database */
				const stems: IStemDoc[] = await Stem.find({})
				res.status(200).json({ success: true, data: stems })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break
		case 'POST':
			try {
				/* create a new model in the database */
				const stem: IStemDoc = await Stem.create(body)

				// Add new stem to user's stems' details
				const userUpdated = await update(`/users/${body.createdBy}`, { newStem: stem._id })
				if (!userUpdated) {
					return res.status(400).json({ success: false, error: "Failed to update user's stems" })
				}

				res.status(201).json({ success: true, data: stem })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break
		default:
			res.status(400).json({ success: false, error: `HTTP method '${method}' not supported` })
			break
	}
}

export default withSentry(handler)
