import { JupiterProvider } from '@jup-ag/react-hook'
import { useEffect } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { actionsSelector, connectionSelector } from '../stores/selectors'
import JupiterForm from '../components/JupiterForm'
import { zeroKey } from '@blockworks-foundation/mango-client'
import { useWallet } from '@solana/wallet-adapter-react'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'swap', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Swap() {
  const connection = useMangoStore(connectionSelector)
  const { connected, publicKey, wallet } = useWallet()
  const actions = useMangoStore(actionsSelector)

  useEffect(() => {
    if (wallet && connected) {
      actions.fetchWalletTokens(wallet)
    }
  }, [connected, actions])

  if (!connection) return null

  const userPublicKey =
    publicKey && !zeroKey.equals(publicKey) ? publicKey : undefined

  return (
    <JupiterProvider
      connection={connection}
      cluster="mainnet-beta"
      userPublicKey={connected ? userPublicKey : undefined}
    >
      <JupiterForm />
    </JupiterProvider>
  )
}
