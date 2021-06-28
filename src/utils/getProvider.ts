// Inspired from:
// https://github.com/darioAnongba/Personal-website/blob/10fc8669e6f7744c70490f804b2c47b47bc87668/src/app/store/actions/web3/getProvider.ts
import { ethers } from 'ethers';

export async function getProvider(): Promise<ethers.providers.Web3Provider | null> {
  const windowTyped = window as any;
  if (windowTyped.ethereum) {
    await windowTyped.ethereum.enable();
    return new ethers.providers.Web3Provider(windowTyped.ethereum);
  } if (windowTyped.web3) {
    const web3Provider = windowTyped.web3.currentProvider;
    return new ethers.providers.Web3Provider(web3Provider);
  }
  window.alert('No ethereum browser detected.');
  return null;
}
