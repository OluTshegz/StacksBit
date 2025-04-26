import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock listing data
const mockListing = {
  listingId: 1,
  seller: "mock-seller",
  buyer: "mock-buyer",
  stxAmount: 1000000, // 1 STX
  btcAmount: 0.5, // 0.5 BTC
  expiresAt: 12000, // Block height when listing expires
};

Clarinet.test({
  name: "get-listing returns correct listing details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create a listing
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-core",
        "create-listing",
        [
          types.uint(mockListing.listingId),
          types.principal(mockListing.seller),
          types.uint(mockListing.stxAmount),
          types.uint(mockListing.btcAmount),
          types.uint(mockListing.expiresAt),
        ],
        deployer.address
      )
    ]);
    
    // Retrieve the listing
    const result = chain.callReadOnlyFn(
      "marketplace-core",
      "get-listing",
      [types.uint(mockListing.listingId)],
      deployer.address
    );
    
    // Validate that the listing details are correct
    assertEquals(result.result.expectOk().expectTuple(), {
      "listing-id": types.uint(mockListing.listingId),
      "seller": types.principal(mockListing.seller),
      "stx-amount": types.uint(mockListing.stxAmount),
      "btc-amount": types.uint(mockListing.btcAmount),
      "expires-at": types.uint(mockListing.expiresAt),
    });
  }
});

Clarinet.test({
  name: "create-listing creates a new listing successfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create a new listing
    const result = chain.callReadOnlyFn(
      "marketplace-core",
      "create-listing",
      [
        types.uint(mockListing.listingId),
        types.principal(mockListing.seller),
        types.uint(mockListing.stxAmount),
        types.uint(mockListing.btcAmount),
        types.uint(mockListing.expiresAt),
      ],
      deployer.address
    );
    
    // Expect success (the listing is created)
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});
