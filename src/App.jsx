import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import twitterLogo from './assets/twitter-logo.svg';
import './styles/App.css';

import { abi } from "./contract/EpicNFT.json";
import { CONTRACT_ADDRESS } from "./contract";

const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TOTAL_MINT_COUNT = 20;

const App = () => {
	const [currentAccount, setCurrentAccount] = useState("");
	const [mintedNFTs, setMintedNFTs] = useState(0);
	const [connectedContract, setConnectedContract] = useState();

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have metamask!");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (!accounts.length) {
			console.log("No authorized account found");
			return;
		}

		const account = accounts[0];
		console.log("Found an authorized account:", account);
		setCurrentAccount(account);
	}

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask!");
				return;
			}

			let chainId = await ethereum.request({ method: 'eth_chainId' });
			console.log("Connected to chain " + chainId);
			
			// String, hex code of the chainId of the Rinkebey test network
			const goerliChainID = "0x5"; 
			if (chainId !== goerliChainID) {
				await ethereum.request({
				  method: 'wallet_switchEthereumChain',
				  params: [{ chainId: '0x5' }], // chainId must be in hexadecimal numbers
				});
			}
			
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	}

	const askContractToMintNft = async () => {

		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

				console.log("Going to pop wallet now to pay gas...")
				let nftTxn = await connectedContract.makeAnEpicNFT();

				console.log("Mining...please wait.")
				await nftTxn.wait();

				console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);

			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error)
		}
	}

	const onNewNFTMint = (from, tokenId) => {
		console.log(from, tokenId.toNumber())
		getMintedNftsAmount()
		alert(`Hey there! We've minted your NFT. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`)
	}

	const getMintedNftsAmount = async () => {
		const nftsMinted = await connectedContract.getNFTsMinted()
		setMintedNFTs(nftsMinted.toString())
	}

	useEffect(() => {
		checkIfWalletIsConnected();

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			setConnectedContract(new ethers.Contract(CONTRACT_ADDRESS, abi, signer));
		}
	}, [])


	useEffect(() => {

		if (connectedContract) {
			getMintedNftsAmount()
			connectedContract.on("NewEpicNFTMinted", onNewNFTMint);
		}

		return () => {
			if (connectedContract) {
				connectedContract.off("NewEpicNFTMinted", onNewNFTMint);
			}
		}
	}, [connectedContract])


	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<p className="header gradient-text">My NFT Collection</p>
					<p className="sub-text">
						Each unique. Each beautiful. Discover your NFT today.
          			</p>
					<p className="minted-nfts-text">
						{mintedNFTs}/{TOTAL_MINT_COUNT}
					</p>
					{currentAccount === "" ? (
						<button onClick={connectWallet} className="cta-button connect-wallet-button">
							Connect to Wallet
    					</button>
					) : (
							<button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
								Mint NFT
						</button>
						)}
				</div>
				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built on @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
};

export default App;