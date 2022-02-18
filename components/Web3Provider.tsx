import PropTypes from 'prop-types'
import type { ReactNode} from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import getWeb3 from '../utils/getWeb3'
import type { Wallet } from 'bnc-onboard/dist/src/interfaces'
import Onboard from 'bnc-onboard'
import FullPageLoading from './FullPageLoading'
import Web3Fallback from './Web3Fallback'
import wallets from '../utils/web3wallets'

// Context types
type Web3ContextProps = {
	web3?: any,
	accounts?: any,
  onboard?: any,
}

type ProviderProps = {
  children: ReactNode
}

// Create context
const Web3Context = createContext<Web3ContextProps>({})

// Context provider
export const Web3Provider = ({children}: ProviderProps): JSX.Element => {
	const [web3, setWeb3] = useState(null)
	const [accounts, setAccounts] = useState<string[]|null>(null)
  const [onboard, setOnboard] = useState<unknown|null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string|null>(null)

	useEffect(() => {
		loadWeb3()
	}, [])

	const loadWeb3 = async () => {
		try {
			// Get network provider and web3 instance
			let web3Instance = await getWeb3()
      setWeb3(web3Instance)

      // initialize onboard
      const onboardInstance = Onboard({
        dappId: process.env.BLOCKNATIVE_KEY,
        networkId: 4, // Rinkeby
        darkMode: true,
        subscriptions: {
          address: async (address: string) => {
            setAccounts([address])
          },
          wallet: async (wallet: Wallet) => {
            console.log(`${wallet.name} connected!`)
          },
        },
        walletSelect: { wallets }
      })
      setOnboard(onboardInstance)

      // Prompt user to select a wallet
      console.log(onboardInstance, onboardInstance.getState())
      // await onboardInstance.walletSelect('metamask')

      // Run wallet checks to make sure that user is ready to transact
      // await onboardInstance.walletCheck()

			// Get accounts initially
			const connectedAccounts = await web3Instance.eth.getAccounts()
			setAccounts(connectedAccounts)

			// Listen for account changes
			web3Instance.currentProvider.on('accountsChanged', async (newAccounts: string[]) => {
				console.info('Switching wallet accounts')
				setAccounts(newAccounts)
			})

			// Listen for chain changes
			web3Instance.currentProvider.on('chainChanged', (chainId: string) => {
				console.info(`Switching wallet networks: Network ID ${chainId} is supported`)
				// Correctly handling chain changes can be complicated
				// Reload the page as simple solution
				window.location.reload()
			})

			setLoading(false)
		} catch (error) {
			// Catch any errors for any of the above operations.
			setError('Failed to load web3, accounts, or contract. Check console for details.')
			console.error(error)
			setLoading(false)
		}
	}

	if (loading) return <FullPageLoading />
	if (error) return <Web3Fallback />

	return <Web3Context.Provider value={{ web3, accounts, onboard }}>{children}</Web3Context.Provider>
}


// Context hook
export const useWeb3 = () => {
	const context: Web3ContextProps = useContext(Web3Context)
	if (context === undefined) {
		throw new Error('useWeb3 must be used within an Web3Provider component.')
	}
	return context
}

export default Web3Context