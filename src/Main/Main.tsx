import { ethers } from 'ethers';
import { ReactElement, useCallback, useState } from 'react';
import { getProvider } from '../utils/getProvider';
import { Form } from './Form';

export function Main(): ReactElement {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const connectWallet = useCallback(async () => {
    const pro = await getProvider();
    if (pro) {
      setProvider(pro);
    }
  }, []);

  return (
    <div>
      <div>
        {!provider && <button onClick={connectWallet} type="button">Connect wallet</button>}
        {!!provider && <>Wallet connected!</>}
      </div>
      <Form provider={provider} />
    </div>
  );
}
