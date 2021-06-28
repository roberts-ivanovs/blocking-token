import { BigNumber, ethers } from 'ethers';
import {
  ReactElement, useEffect, useMemo, useState,
} from 'react';
import _abiUnspendable from 'smart-contracts/artifacts/contracts/Unspendable.sol/Unspendable.json';
import { Unspendable } from 'smart-contracts/typechain/Unspendable';

interface Props {
  provider?: ethers.providers.Web3Provider;
}

export function Form({ provider }: Props): ReactElement {
  const [wei, setWei] = useState('0');
  const [unspendable, setUnspendable] = useState<Unspendable>();
  const isActive = useMemo(() => !!(provider && unspendable), [provider, unspendable]);

  useEffect(() => {
    if (provider) {
      const signer = provider.getSigner();
      const unsp: Unspendable = new ethers.Contract(
        '0xefc26881EA4946c486fC5950b42D6A9fe9c0b612',
        _abiUnspendable.abi,
        signer,
      ) as unknown as Unspendable;
      setUnspendable(unsp);
    }
  }, [provider]);

  return (
    <div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!isActive) return;
          // Send the transaction
          if (provider && unspendable) {
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            console.log(signer);
            console.log(address);
            const res = await unspendable.buyTokensForAddress(address, { value: wei });
          }
        }}
      >
        <input
          disabled={!isActive}
          value={wei}
          onChange={(e) => setWei(e.target.value)}
          type="number"
          placeholder="Wei to send"
          required
        />
        <button type="submit" disabled={!isActive}>
          Buy tokens
        </button>
      </form>
    </div>
  );
}
