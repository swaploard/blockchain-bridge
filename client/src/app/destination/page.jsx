"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import useWalletStore from "../../../store/walletStore";
import WalletConnect from "@/components/walletConnect/index";
import originToken from "@/artifacts/contracts/OriginToken.sol/OriginToken.json";
import destinationToken from "@/artifacts/contracts/DestinationToken.sol/DestinationToken.json";
const Destination = () => {

  const OriginNetworkName = process.env.NEXT_PUBLIC_ORIGIN_NETWORK_NAME;
  
  const DestinationNetworkName = process.env.NEXT_PUBLIC_DESTINATION_NETWORK_NAME;
  const DestinationNetworkId = process.env.NEXT_PUBLIC_DESTINATION_NETWORK_ID;
  
  const originTokenAddress = process.env.NEXT_PUBLIC_ORIGIN_TOKEN_ADDRESS;
  const DestinationTokenAddress = process.env.NEXT_PUBLIC_DESTINATION_TOKEN_ADDRESS;
 
   const bridgeWallet = process.env.NEXT_PUBLIC_BRIDGE_WALLET;

  const walletStore = useWalletStore();

  const [amount, setAmount] = useState(0);
  const [trxInProgress, setTrxInProgress] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [Dcontract, setDcontract] = useState(null);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getSigner = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        setSigner(newSigner);
        setProvider(newProvider);
      } else {
        console.log('MetaMask is not installed');
      }
    };
    getSigner();
  }, []);

  useEffect(() => {
    if (signer && originTokenAddress) {
      const contractInstance = new ethers.Contract(
        originTokenAddress,
        originToken.abi,
        signer
      );
      setContract(contractInstance);
    }

    if (signer && DestinationTokenAddress) {
      const DcontractInstance = new ethers.Contract(
        DestinationTokenAddress,
        destinationToken.abi,
        signer
      );
      setDcontract(DcontractInstance);
    }

    checkBalance();
  }, [signer, originTokenAddress, walletStore.address]);

  const checkBalance = async () => {
    if (contract && walletStore.address) {
      try {
        const balance = await contract.balanceOf(walletStore.address);
        const formattedBalance = ethers.formatUnits(balance, 18);
        setBalance(formattedBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };


  const sendTokens = async () => {
    if (!contract || !amount) {
      console.error("Contract not initialized or amount is zero");
      return;
    }

    const amountFormatted = ethers.parseUnits(amount.toString(), 18);

    if (typeof window.ethereum !== 'undefined') {
      setTrxInProgress(true);

      try {
        const transaction = await contract.transfer(
          bridgeWallet, // Ensure this is defined
          amountFormatted
        );

        console.log("Transaction:", transaction);
        await transaction.wait();
        console.log("Transaction confirmed");
        setAmount(0);
        setTrxInProgress(false);
      } catch (error) {
        console.error("Error sending tokens:", error);
        setTrxInProgress(false);
      }
    }
  };

  const handleAmount = (e) => {
    setAmount(e.target.value);
  };

  return (
    <>
      <div className="mt-16 flex flex-col items-center">
        <h1 className="text-center text-2xl font-semibold text-gray-800">
          {`Bridge from ${OriginNetworkName} to ${DestinationNetworkName}`}
        </h1>
        <p className="mt-4 text-center text-gray-600">
          {`This bridge allows you to send Tokens from
          ${OriginNetworkName} to ${DestinationNetworkName}`}
        </p>
        <div className="my-4">
          <WalletConnect
            targetNetwork={DestinationNetworkName}
            targetNetworkId={DestinationNetworkId}
            currency={"ETH"}
            decimals={18}
            isNewNetwork={true}
          />
        </div>
        <form className="w-96 mt-8 mx-auto">
          <div className="flex justify-center">
            <label htmlFor="price" className="block mb-2 font-medium text-gray-700">
              How much CHSD do you want to bridge?
            </label>
          </div>
          <div className="mt-4 w-2/3 mx-auto relative rounded-md shadow-sm">
            <input
              type="text"
              onChange={handleAmount}
              name="price"
              id="price"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border border-gray-300 rounded-md py-2"
              placeholder="0.00"
              aria-describedby="price-currency"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm" id="price-currency">
                CHSD
              </span>
            </div>
          </div>
          <div className="flex justify-center items-center flex-col">
            <p className="text-xs mt-4">Your balance is: {balance}</p>
            <button
              type="button"
              onClick={sendTokens}
              disabled={trxInProgress}
              className="inline-flex items-center px-4 py-2 mt-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-44"
            >
              {trxInProgress ? `Processing...` : `Bridge to Sepolia`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Destination;
