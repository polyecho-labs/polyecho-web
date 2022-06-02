import type { NextApiRequest, NextApiResponse } from 'next'
import { INftDoc, Nft } from '../../../models/nft.model'
import type { IProjectDoc } from '../../../models/project.model'
import { Project } from '../../../models/project.model'
import type { IStemDoc } from '../../../models/stem.model'
import { Stem } from '../../../models/stem.model'
import type { IUser, IUserFull } from '../../../models/user.model'
import { User } from '../../../models/user.model'
import dbConnect from '../../../utils/db'
import { withSentry } from '@sentry/nextjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const {
		query: { id, params },
		body,
		method,
	} = req

	await dbConnect()

	switch (method) {
		case 'GET' /* Get a model by its ID */:
			try {
				// We will always be getting users by their address, not their MongoDB _id.
				const user: IUser | null = await User.findOne({ address: id })

				if (!user) {
					return res.status(404).json({ success: false })
				}

				// Check to get full details or not
				const paramData = typeof params === 'object' ? params[0] : params
				if (paramData) {
					const paramsJson = JSON.parse(paramData)
					const getFullDetails: boolean = paramsJson?.fullDetails ?? false
					if (getFullDetails) {
						const fullUser: IUserFull = {
							...user,
							projects: [],
							stems: [],
							nfts: [],
						}

						// Get user's NFT details
						for (const nftId of user.nftIds) {
							const nft: INftDoc | null = await Nft.findById(nftId)
							if (nft) fullUser.nfts.push(nft)
							else console.error(`Failed to find user NFT of ID - ${nftId}`)
						}

						// Get user's projects' details
						for (const projectId of user.projectIds) {
							const project: IProjectDoc | null = await Project.findById(projectId)
							if (project) fullUser.projects.push(project)
							else console.error(`Failed to find user project of ID - ${projectId}`)
						}

						// Get user's stems' details
						for (const stemId of user.stemIds) {
							const stem: IStemDoc | null = await Stem.findById(stemId)
							if (stem) fullUser.stems.push(stem)
							else console.error(`Failed to find user stem of ID - ${stemId}`)
						}

						res.status(200).json({ success: true, data: fullUser })
					}
					res.status(200).json({ success: true, data: user })
				} else {
					res.status(200).json({ success: true, data: user })
				}
			} catch (error) {
				console.error(error)
				res.status(400).json({ success: false })
			}
			break

		case 'PUT' /* Edit a model by its ID */:
			try {
				let user
				if (body.newProject) {
					// Update the Projects list
					user = await User.findOneAndUpdate(
						{ address: id },
						{
							$addToSet: {
								projectIds: body.newProject,
							},
						},
						{
							new: true,
							runValidators: true,
						},
					)
					// Returns
					if (!user) {
						return res.status(400).json({ success: false, error: 'failed to add project to user' })
					}
					res.status(200).json({ success: true, data: user })
				} else if (body.newStem) {
					// Update the stems list for the user, add to it if doesn't exist
					user = await User.findOneAndUpdate(
						{ address: id },
						{
							$addToSet: {
								stemIds: body.newStem,
							},
						},
						{
							new: true,
							runValidators: true,
						},
					)
					// Returns
					if (!user) {
						return res.status(400).json({ success: false, error: 'failed to add stem to user' })
					}
					res.status(200).json({ success: true, data: user })
				} else if (body.addNFT) {
					// Update the NFTs list
					user = await User.findOneAndUpdate(
						{ address: id },
						{
							$addToSet: {
								nftIds: body.addNFT,
							},
						},
						{
							new: true,
							runValidators: true,
						},
					)
					// Returns
					if (!user) {
						return res.status(400).json({ success: false, error: 'failed to add NFT to user' })
					}
					res.status(200).json({ success: true, data: user })
				} else if (body.removeNFT) {
					// Update the NFTs list
					user = await User.findOneAndUpdate(
						{ address: id },
						{
							$pull: {
								nftIds: body.removeNFT,
							},
						},
						{
							new: true,
							runValidators: true,
						},
					)
					// Returns
					if (!user) {
						return res.status(400).json({ success: false, error: 'failed to add NFT to user' })
					}
					res.status(200).json({ success: true, data: user })
				} else {
					user = await User.findOneAndUpdate({ address: id }, body, {
						new: true,
						runValidators: true,
					})
					// Returns
					if (!user) {
						return res.status(400).json({ success: false, error: 'failed to update user' })
					}
					res.status(200).json({ success: true, data: user })
				}
			} catch (e) {
				res.status(400).json({ success: false, error: e })
			}
			break

		case 'DELETE' /* Delete a model by its ID */:
			try {
				const deletedUser = await User.deleteOne({ _id: id })
				if (!deletedUser) {
					return res.status(400).json({ success: false, error: 'failed to delete user' })
				}
				res.status(200).json({ success: true, data: deletedUser })
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
