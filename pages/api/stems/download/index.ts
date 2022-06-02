// import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'
import downloadURL, { zipDirectory } from '../../../../utils/downloadURL'
import logger from '../../../../utils/logger'
import { withSentry } from '@sentry/nextjs'

/**
 * Takes in a URL to download from and writes the file to a stream
 * @param req.body.url - An IPFS CID that represent an individual stem
 * @returns res.data - A file to write to
 */
// TODO: Put a much longer timeout for this handler as downloading/zipping files could take a bit of time
// i.e. https://github.com/expressjs/timeout
async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { method, body } = req
	const projectId: string = body.projectId
	const stemData: { url: string; filename: string }[] = body.stemData

	// Download files into a tmp directory in /public and then download it with an anchor tag
	let baseDownloadsDir
	let zipDownloadsDir
	if (process.env.NODE_ENV === 'production') {
		const home = process.env.HOME ?? '/app' // Heroku's fs
		// use build static dir
		baseDownloadsDir = `${home}/tmp/downloads/${projectId}`
		zipDownloadsDir = `${home}/tmp/exports/${projectId}`
		logger.blue(
			`NODE_ENV is ${process.env.NODE_ENV} - downloading into ${baseDownloadsDir} - zipping into ${zipDownloadsDir}`,
		)
	} else {
		// local dev, use public dir
		baseDownloadsDir = path.resolve(__dirname, '../../../../../public/') + `/tmp/downloads/${projectId}`
		zipDownloadsDir = path.resolve(__dirname, '../../../../../public/') + `/tmp/exports/${projectId}`
	}

	console.log({ baseDownloadsDir, zipDownloadsDir })

	switch (method) {
		case 'POST':
			try {
				// 1. Use downloadURL utility to download each stem to a temp directory, convert IPFS:// to web links
				await Promise.all(
					stemData.map(async stem => {
						let uri = stem.url
						// If is ipfs uri, transform to web link
						if (stem.url.includes('ipfs://')) {
							uri = stem.url.replace('ipfs://', '').replace('/blob', '')
							uri = 'https://' + uri + '.ipfs.dweb.link/blob'
						}
						const downloadPath = `${baseDownloadsDir}/${stem.filename.trim().replace(' ', '_')}` // Includes .wav in most cases,
						// A new file will be downloaded at {host}/tmp/downloads/{projectId}/{filename}.wav
						await downloadURL(uri, baseDownloadsDir, downloadPath)
					}),
				)
				// 2. Compress the temp directory to a .zip file to prep for a single file download
				const zippedRes = await zipDirectory(
					`${baseDownloadsDir}/`,
					zipDownloadsDir,
					`PolyechoStems_${projectId}_${Date.now()}.zip`,
				)
				if (!zippedRes) return res.status(400).json({ success: false })
				// A zipped file will be available at {host}/tmp/exports/PolyechoStems_{projectId}_{timestamp}.zip
				return res.status(200).json({ success: true, data: zippedRes })
			} catch (e: any) {
				console.error('Error downloading stems', e)
				return res.status(400).json({ success: false, error: e })
			}
		case 'DELETE':
			try {
				if (fs.existsSync(baseDownloadsDir)) fs.rmSync(baseDownloadsDir, { recursive: true })
				if (fs.existsSync(zipDownloadsDir)) fs.rmSync(zipDownloadsDir, { recursive: true })
				return res.status(200).json({ success: true, data: 'ok' })
			} catch (e: any) {
				console.error('Error deleting stems', e)
				return res.status(400).json({ success: false, error: e })
			}
		default:
			return res.status(400).json({ success: false, error: `HTTP method '${method}' not supported` })
	}
}

export default withSentry(handler)
