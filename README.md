# StacksBit

## A Decentralized Bitcoin P2P Marketplace on Stacks

StacksBit is a trustless peer-to-peer marketplace for Bitcoin trading built on the Stacks blockchain. It uses smart contracts written in Clarity to enable secure, non-custodial trading of Bitcoin with escrow protection.

## 📋 Overview

StacksBit enables users to:
- Create listings to sell Bitcoin for STX
- Purchase Bitcoin with STX using a secure escrow system
- Verify actual Bitcoin transactions through oracles
- Resolve disputes through a transparent arbitration system
- Trade with lower fees than centralized exchanges

## 🏗️ Architecture

The project is organized into modular Clarity contracts:

- **marketplace-core.clar**: Core listing functionality
- **marketplace-escrow.clar**: Handles escrow operations
- **marketplace-btc-verification.clar**: Bitcoin transaction verification
- **marketplace-disputes.clar**: Dispute resolution system
- **marketplace-helpers.clar**: Helper functions for contract interaction
- **marketplace-utils.clar**: Utility functions and calculations
- **marketplace-client.clar**: Client-facing convenience functions

## 🔄 How It Works

1. **Listing Creation**: Sellers create listings specifying the amount of BTC for sale and the price in STX
2. **Purchase**: Buyers place STX in escrow through the contract
3. **BTC Transfer**: Sellers send BTC to the buyer's address (off-chain)
4. **Verification**: The contract verifies the Bitcoin transaction occurred
5. **Settlement**: Upon verification, the contract releases STX to the seller

## 🔒 Security Features

- Non-custodial design - the contract never holds Bitcoin
- STX remains in escrow until Bitcoin transaction is verified
- Built-in dispute resolution for conflict management
- Verify Bitcoin transactions using cryptographic proofs
- Role-based permissions for contract functions

## 🚀 Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) - Clarity development toolkit
- [STX wallet](https://wallet.hiro.so/) - For interacting with the deployed contracts
- [Bitcoin wallet](https://bitcoin.org/en/choose-your-wallet) - For sending/receiving BTC

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stacksbit.git
cd stacksbit

# Install Clarinet if you haven't already
curl -sSL https://get.clarinet.run | sh

# Initialize the Clarinet project
clarinet integrate
```

### Running Tests

```bash
clarinet test
```

### Deployment

```bash
clarinet deploy
```

## 📊 Contract Interactions

### Creating a Listing

```clarity
(contract-call? .marketplace-core create-listing 
    u55000000000    ;; Price per BTC in STX (micro-STX)
    u100000000      ;; Amount of BTC (in satoshis - 1 BTC)
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"  ;; BTC address
    u1440)          ;; Expiration in blocks (approx. 10 days)
```

### Purchasing From a Listing

```clarity
(contract-call? .marketplace-escrow purchase-listing
    u1              ;; Listing ID
    "bc1qwkp3elgnkjx9nkv6v4gxjz6v8sdhnn6u2dd7fq")  ;; Buyer's BTC address
```

### Confirming BTC Receipt

```clarity
(contract-call? .marketplace-escrow confirm-receipt u1)  ;; Listing ID
```

## 🧪 Testing

StacksBit includes comprehensive test suites for each contract. Run them with:

```bash
clarinet test tests/marketplace-core_test.ts
clarinet test tests/marketplace-escrow_test.ts
```

## 🛣️ Roadmap

- [ ] Price oracle integration for dynamic pricing
- [ ] Multi-sig escrow for high-value transactions
- [ ] Reputation system for buyers and sellers
- [ ] Support for Lightning Network transactions
- [ ] Mobile app integration

## 🔗 Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/docs/clarity/)
- [Bitcoin Protocol](https://developer.bitcoin.org/reference/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

For questions or support, please open an issue in the GitHub repository or contact the team at contact@stacksbit.xyz.