import type { NextApiRequest, NextApiResponse } from 'next'
import { IStemDoc, Stem } from '../../../models/stem.model'
import dbConnect from '../../../utils/db'
import { withSentry } from '@sentry/nextjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const {
		query: { id },
		body,
		method,
	} = req

	await dbConnect()

	switch (method) {
		case 'GET' /* Get a model by its ID */:
			try {
				const stem: IStemDoc | null = await Stem.findById(id)
				if (!stem) {
					return res.status(400).json({ success: false })
				}
				res.status(200).json({ success: true, data: stem })
			} catch (error) {
				res.status(400).json({ success: false })
			}
			break

		case 'PUT' /* Edit a model by its ID */:
			try {
				// Update anything passed through,
				const stem: IStemDoc | null = await Stem.findByIdAndUpdate(id, body, {
					new: true,
					runValidators: true,
				})

				// Catch error
				if (!stem) {
					return res.status(400).json({ success: false, error: 'failed to update stem' })
				}

				res.status(200).json({ success: true, data: stem })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break

		case 'DELETE' /* Delete a model by its ID */:
			try {
				const deletedStem = await Stem.deleteOne({ _id: id })
				if (!deletedStem) {
					return res.status(400).json({ success: false, error: 'failed to delete stem' })
				}

				// TODO: Delete from user's stems

				res.status(200).json({ success: true, data: deletedStem })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break

		default:
			res.status(400).json({ success: false, error: `HTTP method '${method}' is not supported` })
			break
	}
}

export default withSentry(handler)
