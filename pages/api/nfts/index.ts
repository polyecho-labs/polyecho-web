import type { NextApiRequest, NextApiResponse } from 'next'
import { INft, INftDoc, Nft } from '../../../models/nft.model'
import dbConnect from '../../../utils/db'
import { update } from '../../../utils/http'
import { withSentry } from '@sentry/nextjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { method, body } = req
	await dbConnect()

	switch (method) {
		case 'GET':
			try {
				/* find all the data in our database */
				const nfts: INftDoc[] = await Nft.find({})
				res.status(200).json({ success: true, data: nfts })
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break
		case 'POST':
			try {
				// Construct payload
				const {
					createdBy,
					owner,
					isListed,
					listPrice,
					token,
					metadataUrl,
					audioHref,
					name,
					projectId,
					collaborators,
					stems,
				} = body
				const payload: INft = {
					createdBy,
					owner,
					isListed,
					listPrice,
					token,
					metadataUrl,
					audioHref,
					name,
					projectId,
					collaborators,
					stems,
				}

				/* create a new model in the database */
				const nftCreated: any = await Nft.create(payload)

				// Add the new NFT reference to list of User NFTs field
				const userUpdated = await update(`/users/${token.data.from}`, { addNFT: nftCreated._id })
				if (!userUpdated) return res.status(400).json({ success: false, error: "Failed to update user's NFTs" })

				// TODO: Add the new NFT reference to list of the Project's NFTs that have been minted for given projectId

				res.status(201).json({ success: true, data: nftCreated })
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
