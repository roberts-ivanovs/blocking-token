import { ethers } from 'ethers';
import React, { ReactElement, useMemo, useState } from 'react';

interface Props {
  provider?: ethers.providers.Web3Provider;
}

export function Form({ provider }: Props): ReactElement {
  const [weiToSend, setWeiToSend] = useState(0);

  const isActive = useMemo(() => !!provider, [provider]);

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!isActive) return;

          // TODO: Send the transaction

        }}
      >
        <input
          disabled={!isActive}
          value={weiToSend}
          onChange={(e) => setWeiToSend(Number(e.target.value))}
          type="number"
          placeholder="0"
          required
        />
        <button type="submit" disabled={!isActive}>
          Send
        </button>
      </form>
    </div>
  );
}
