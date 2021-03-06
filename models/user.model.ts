import mongoose from 'mongoose'
import type { INftDoc } from './nft.model'
import type { IProjectDoc } from './project.model'
import type { IStemDoc } from './stem.model'

export interface IUser {
	address: string
	displayName: string
	avatarUrl: string
	nftIds: string[]
	projectIds: string[]
	stemIds: string[]
	createdAt: string
	updatedAt: string
	voterIdentityCommitment: string
	registeredGroupIds: number[]
}

export interface IUserFull extends IUser {
	nfts: INftDoc[]
	projects: IProjectDoc[]
	stems: IStemDoc[]
}

export interface IUserDoc extends Document, IUser {}

const userSchema = new mongoose.Schema<IUserDoc>(
	{
		address: {
			type: String,
			required: true,
			// validate it is an ethereum-like address (Joi?)
			unique: true,
		},
		displayName: {
			type: String,
			required: false,
			trim: true,
			minLength: 3,
			maxlength: 50,
		},
		avatarUrl: {
			type: String,
			required: false,
			default: '',
		},
		nftIds: {
			type: [String],
			required: false,
			default: [],
		},
		projectIds: {
			type: [String],
			required: false,
			default: [],
		},
		stemIds: {
			type: [String],
			required: false,
			default: [],
		},
		// Semaphore identity commitment
		voterIdentityCommitment: {
			type: String,
			required: false,
		},
		registeredGroupIds: {
			type: [Number],
			required: false,
			default: [],
		},
	},
	{ timestamps: true },
)

export const User = mongoose.models.user || mongoose.model<IUserDoc>('user', userSchema)
