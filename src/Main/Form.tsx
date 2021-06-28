import { ethers } from 'ethers';
import {
  ReactElement, useEffect, useMemo, useState,
} from 'react';
import _abiUnspendable from 'smart-contracts/artifacts/contracts/Unspendable.sol/Unspendable.json';
import { Unspendable } from 'smart-contracts/typechain/Unspendable';

interface Props {
  provider?: ethers.providers.Web3Provider;
}

export function Form({ provider }: Props): ReactElement {
  const [ether, setEther] = useState('0');
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
      signer.getAddress().then((signerAddress) => {
        const unspendableWithSigner = unsp.connect(signerAddress);
        setUnspendable(unspendableWithSigner);
      });
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
            const signerAddress = await signer.getAddress();
            const wei = Number(ether) * 10 ** 18;
            // const tx = await signer.signTransaction({ value: wei });
            const res = await unspendable.buyTokensForAddress(signerAddress, { value: wei });
          }
        }}
      >
        <input
          disabled={!isActive}
          value={ether}
          onChange={(e) => setEther(e.target.value)}
          type="number"
          placeholder="Ether to send"
          required
        />
        <button type="submit" disabled={!isActive}>
          Buy tokens
        </button>
      </form>
    </div>
  );
}
