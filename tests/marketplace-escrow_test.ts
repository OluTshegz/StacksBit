import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock data for testing
const mockEscrow = {
  buyer: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  seller: "ST3J7S3QD7W2V9N9FBKHQ8H2PKK5Q38YQSXANSS2Q",
  stxAmount: 100000,
  btcAmount: 0.5,
  btcReceiverAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  status: "active",
  createdAt: 11000
};

Clarinet.test({
  name: "purchase-listing places STX in escrow and updates the listing",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const platformWallet = accounts.get("platform-wallet")!;

    // Simulate the purchase of a listing by transferring STX to escrow
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "purchase-listing",
        [
          types.uint(1), // Listing ID
          types.ascii(mockEscrow.btcReceiverAddress),
        ],
        deployer.address
      )
    ]);

    // Check that the escrow entry was created
    const result = chain.callReadOnlyFn(
      "marketplace-escrow",
      "get-escrow",
      [types.uint(1)], // Listing ID
      deployer.address
    );

    const escrow = result.result.expectOk().expectTuple();
    assertEquals(escrow.buyer, mockEscrow.buyer);
    assertEquals(escrow.seller, mockEscrow.seller);
    assertEquals(escrow.stxAmount, types.uint(mockEscrow.stxAmount));
    assertEquals(escrow.btcAmount, types.uint(mockEscrow.btcAmount));
    assertEquals(escrow.btcReceiverAddress, types.ascii(mockEscrow.btcReceiverAddress));
    assertEquals(escrow.status, types.ascii("active"));
    assertEquals(escrow.createdAt, types.uint(mockEscrow.createdAt));
  }
});

Clarinet.test({
  name: "confirm-receipt releases STX to the seller when BTC transaction is verified",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const buyer = accounts.get("buyer")!;
    const seller = accounts.get("seller")!;

    // Create an escrow first
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "purchase-listing",
        [
          types.uint(1),
          types.ascii(mockEscrow.btcReceiverAddress),
        ],
        buyer.address
      )
    ]);

    // Mock BTC transaction verification (assuming tx-id verification is successful)
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "confirm-receipt",
        [types.uint(1)], // Listing ID
        buyer.address
      )
    ]);

    // Check if STX has been transferred to the seller
    const result = chain.callReadOnlyFn(
      "marketplace-escrow",
      "get-escrow",
      [types.uint(1)],
      deployer.address
    );

    const escrow = result.result.expectOk().expectTuple();
    assertEquals(escrow.status, types.ascii("completed"));
  }
});

Clarinet.test({
  name: "confirm-receipt fails if BTC transaction is not verified",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const buyer = accounts.get("buyer")!;

    // Create an escrow first
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "purchase-listing",
        [
          types.uint(1),
          types.ascii(mockEscrow.btcReceiverAddress),
        ],
        buyer.address
      )
    ]);

    // Try confirming receipt before BTC verification
    const result = chain.callReadOnlyFn(
      "marketplace-escrow",
      "confirm-receipt",
      [types.uint(1)],
      buyer.address
    );

    // Verify that the confirmation fails due to unverified BTC tx
    result.result.expectErr().expectUint(8); // ERR-BTC-TX-UNVERIFIED
  }
});

Clarinet.test({
  name: "open-dispute correctly updates escrow status to 'disputed'",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const buyer = accounts.get("buyer")!;
    const seller = accounts.get("seller")!;

    // Create an escrow first
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "purchase-listing",
        [
          types.uint(1),
          types.ascii(mockEscrow.btcReceiverAddress),
        ],
        buyer.address
      )
    ]);

    // Open a dispute
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "open-dispute",
        [
          types.uint(1),
          types.ascii("Dispute reason")
        ],
        buyer.address
      )
    ]);

    // Verify escrow status is updated to 'disputed'
    const result = chain.callReadOnlyFn(
      "marketplace-escrow",
      "get-escrow",
      [types.uint(1)],
      deployer.address
    );

    const escrow = result.result.expectOk().expectTuple();
    assertEquals(escrow.status, types.ascii("disputed"));
  }
});

Clarinet.test({
  name: "refund-escrow correctly refunds STX to the buyer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const platformWallet = accounts.get("platform-wallet")!;
    const buyer = accounts.get("buyer")!;

    // Create an escrow first
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "purchase-listing",
        [
          types.uint(1),
          types.ascii(mockEscrow.btcReceiverAddress),
        ],
        buyer.address
      )
    ]);

    // Open a dispute and set escrow to disputed
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "open-dispute",
        [
          types.uint(1),
          types.ascii("Dispute reason")
        ],
        buyer.address
      )
    ]);

    // Refund STX to buyer (only platform can refund)
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-escrow",
        "refund-escrow",
        [types.uint(1)],
        platformWallet.address
      )
    ]);

    // Verify that escrow status is 'refunded'
    const result = chain.callReadOnlyFn(
      "marketplace-escrow",
      "get-escrow",
      [types.uint(1)],
      deployer.address
    );

    const escrow = result.result.expectOk().expectTuple();
    assertEquals(escrow.status, types.ascii("refunded"));
  }
});
