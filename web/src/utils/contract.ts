import { VouchMe__factory } from "@/typechain-types";

export const CONTRACT_ADDRESSES: { [key: number]: string } = {
  534351: "0xC1B6eFE2Db981147ABC470f9A26D8Aa9B2Ce887f", // Scroll Sepolia
  63: "0x3c9a98c58be8410c3510d5ccc671e35b7df55e08", // Mordor
  61: "0xF01b3744cc6bDc115bF4A154A0041Bce3251A932", // Ethereum Classic
};

export const VouchMeFactory = VouchMe__factory;
