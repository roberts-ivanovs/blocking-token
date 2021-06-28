import { ethers } from 'ethers';
import { ReactElement, useCallback, useState } from 'react';
import { Form } from './Form';

export function Main(): ReactElement {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const connectWallet = useCallback(() => {
    if ((window as any).ethereum) {
      const prov = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(prov);
    } else {
      // eslint-disable-next-line no-alert
      window.alert('No ethereum browser detected.');
    }
  }, []);

  return (
    <div>
      <div>
        <button onClick={connectWallet} type="button">Connect wallet</button>
      </div>
      <Form provider={provider} />
    </div>
  );
}
