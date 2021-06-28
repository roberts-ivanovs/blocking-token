import { ethers } from 'ethers';
import { ReactElement, useCallback, useState } from 'react';
import { Form } from './Form';

export function Main(): ReactElement {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const connectWallet = useCallback(() => {
    console.log((window as any).ethereum);
    if ((window as any).ethereum) {
      const prov = new ethers.providers.Web3Provider((window as any).ethereum);
      (window as any).ethereum.enable();
      setProvider(prov);
    } else {
      // eslint-disable-next-line no-alert
      window.alert('No ethereum browser detected.');
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
