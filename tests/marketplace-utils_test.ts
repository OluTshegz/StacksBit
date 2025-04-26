import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock data for testing
const mockListing = {
  pricePerBtc: 5000000000, // 5 BTC in satoshis
  btcAmount: 0.5, // 0.5 BTC
  stxAmount: 1000000, // 1 STX
  feeBasisPoints: 1000, // 10% fee
};

Clarinet.test({
  name: "calculate-stx-required calculates STX required based on BTC amount and price per BTC",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Calculate STX required for the given BTC amount
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "calculate-stx-required",
      [
        types.uint(mockListing.pricePerBtc),
        types.uint(mockListing.btcAmount)
      ],
      deployer.address
    );
    
    const expectedStxAmount = mockListing.pricePerBtc * mockListing.btcAmount / 100000000; // Converting to STX
    
    // Verify the result
    assertEquals(result.result.expectOk().expectUint(), expectedStxAmount);
  }
});

Clarinet.test({
  name: "calculate-fee calculates the fee for a given amount based on fee basis points",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Calculate the fee for a given amount
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "calculate-fee",
      [
        types.uint(mockListing.stxAmount),
        types.uint(mockListing.feeBasisPoints),
      ],
      deployer.address
    );
    
    const expectedFee = (mockListing.stxAmount * mockListing.feeBasisPoints) / 10000; // Fee calculation
    
    // Verify the result
    assertEquals(result.result.expectOk().expectUint(), expectedFee);
  }
});

Clarinet.test({
  name: "calculate-platform-fee calculates platform fee correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Calculate platform fee based on the STX amount
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "calculate-platform-fee",
      [
        types.uint(mockListing.stxAmount),
      ],
      deployer.address
    );
    
    const platformFee = mockListing.stxAmount * 1000 / 10000; // Platform fee
    
    // Verify the result
    assertEquals(result.result.expectOk().expectUint(), platformFee);
  }
});

Clarinet.test({
  name: "blocks-to-time converts blocks to approximate time in seconds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Convert 100 blocks to time in seconds
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "blocks-to-time",
      [
        types.uint(100), // 100 blocks
      ],
      deployer.address
    );
    
    const expectedTime = 100 * 600; // 100 blocks * 10 minutes per block = 6000 seconds
    
    // Verify the result
    assertEquals(result.result.expectOk().expectUint(), expectedTime);
  }
});

Clarinet.test({
  name: "is-listing-expired checks if a listing is expired",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Simulate an expired listing
    const expiredListing = {
      expiresAt: 11000, // Current block height + 1
    };
    
    // Assuming the current block height is 11000
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-core",
        "get-listing",
        [types.uint(1)],
        deployer.address
      )
    ]);
    
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "is-listing-expired",
      [
        types.uint(1), // Listing ID
      ],
      deployer.address
    );
    
    // Check if the listing has expired
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "format-btc-amount formats satoshis to BTC amount correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Format 50000000 satoshis (0.5 BTC)
    const result = chain.callReadOnlyFn(
      "marketplace-utils",
      "format-btc-amount",
      [
        types.uint(50000000), // 0.5 BTC in satoshis
      ],
      deployer.address
    );
    
    // Verify that the formatted value matches
    assertEquals(result.result.expectOk().expectUint(), 50000000);
  }
});
