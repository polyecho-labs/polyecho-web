require('@nomiclabs/hardhat-waffle')

// Keys
/* eslint-disable-next-line */
const { ALCHEMY_API_KEY, ARBITRUM_TESTNET_PRIVATE_KEY } = require('./keys')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
	console.log({ alchemy: ALCHEMY_API_KEY, arbitrum: ARBITRUM_TESTNET_PRIVATE_KEY })
	const accounts = await hre.ethers.getSigners()

	for (const account of accounts) {
		console.log(account.address)
	}
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config = {
	solidity: '0.8.1',
	networks: {
		arbitrum: {
			url: `https://arb-rinkeby.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
			accounts: [`${ARBITRUM_TESTNET_PRIVATE_KEY}`],
		},
	},
}

module.exports = config
