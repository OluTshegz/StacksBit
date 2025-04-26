import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock data for testing
const mockListing = {
  seller: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
  "price-per-btc": 20000000000, // 20k STX per BTC
  "btc-amount": 100000000, // 1 BTC
  "stx-required": 20000000000, // 20k STX
  "btc-address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  active: true,
  "created-at": 10000,
  "expires-at": 20000
};

const mockEscrow = {
  buyer: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  amount: 20000000000,
  "created-at": 10500
};

const mockDispute = {
  initiator: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  reason: "Payment not received",
  "created-at": 11000,
  resolved: false
};

Clarinet.test({
  name: "get-listing-with-details returns correct data structure",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Mock the response from core, escrow, and disputes contracts
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-core",
        "set-test-listing",
        [types.uint(1), types.principal(mockListing.seller), types.uint(mockListing["price-per-btc"]), 
         types.uint(mockListing["btc-amount"]), types.uint(mockListing["stx-required"]), 
         types.ascii(mockListing["btc-address"]), types.bool(mockListing.active), 
         types.uint(mockListing["created-at"]), types.uint(mockListing["expires-at"])],
        deployer.address
      ),
      Tx.contractCall(
        "marketplace-escrow",
        "set-test-escrow",
        [types.uint(1), types.principal(mockEscrow.buyer), types.uint(mockEscrow.amount), types.uint(mockEscrow["created-at"])],
        deployer.address
      ),
      Tx.contractCall(
        "marketplace-disputes",
        "set-test-dispute",
        [types.uint(1), types.principal(mockDispute.initiator), types.ascii(mockDispute.reason), 
         types.uint(mockDispute["created-at"]), types.bool(mockDispute.resolved)],
        deployer.address
      )
    ]);
    
    // Set block height for testing expiration
    chain.mineEmptyBlockUntil(15000);
    
    const result = chain.callReadOnlyFn(
      "marketplace-client",
      "get-listing-with-details",
      [types.uint(1)],
      deployer.address
    );
    
    // Verify structure and some basic values
    const data = result.result.expectOk().expectTuple();
    const listing = data.listing.expectSome().expectTuple();
    const escrow = data.escrow.expectSome().expectTuple();
    const dispute = data.dispute.expectSome().expectTuple();
    
    assertEquals(listing.seller, mockListing.seller);
    assertEquals(escrow.buyer, mockEscrow.buyer);
    assertEquals(dispute.initiator, mockDispute.initiator);
    assertEquals(data["is-active"], types.bool(true));
    assertEquals(data["is-expired"], types.bool(false)); // Current height 15000 < expires-at 20000
  }
});

Clarinet.test({
  name: "get-listings-batch returns filtered valid listings",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Setup: Create multiple listings in the core contract
    chain.mineBlock([
      // Set listing count
      Tx.contractCall(
        "marketplace-core",
        "set-test-listing-count",
        [types.uint(3)],
        deployer.address
      ),
      // Set up some test listings
      Tx.contractCall(
        "marketplace-core",
        "set-test-listing",
        [types.uint(1), types.principal(mockListing.seller), types.uint(mockListing["price-per-btc"]), 
         types.uint(mockListing["btc-amount"]), types.uint(mockListing["stx-required"]), 
         types.ascii(mockListing["btc-address"]), types.bool(true), 
         types.uint(mockListing["created-at"]), types.uint(mockListing["expires-at"])],
        deployer.address
      ),
      Tx.contractCall(
        "marketplace-core",
        "set-test-listing",
        [types.uint(2), types.principal(mockListing.seller), types.uint(mockListing["price-per-btc"]), 
         types.uint(mockListing["btc-amount"]), types.uint(mockListing["stx-required"]), 
         types.ascii(mockListing["btc-address"]), types.bool(false), // Inactive
         types.uint(mockListing["created-at"]), types.uint(mockListing["expires-at"])],
        deployer.address
      )
    ]);
    
    const result = chain.callReadOnlyFn(
      "marketplace-client",
      "get-listings-batch",
      [types.uint(1), types.uint(2)], // Get listings 1-2
      deployer.address
    );
    
    // Verify we get valid listings back
    const listings = result.result.expectList();
    assertEquals(listings.length, 2);
    
    // Verify first listing details
    const firstListing = listings[0].expectSome().expectTuple();
    assertEquals(firstListing.active, types.bool(true));
  }
});

Clarinet.test({
  name: "get-seller-listings returns listings for a seller",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const seller = accounts.get("wallet_1")!;
    
    const result = chain.callReadOnlyFn(
      "marketplace-client",
      "get-seller-listings",
      [types.principal(seller.address)],
      seller.address
    );
    
    // Check structure of response
    const response = result.result.expectTuple();
    assertEquals(response.seller, types.principal(seller.address));
    const listings = response.listings.expectList();
    // Verify that we got a list (even if it's empty in this test)
    assertEquals(true, Array.isArray(listings));
  }
});

Clarinet.test({
  name: "get-buyer-purchases returns purchases for a buyer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const buyer = accounts.get("wallet_2")!;
    
    const result = chain.callReadOnlyFn(
      "marketplace-client",
      "get-buyer-purchases",
      [types.principal(buyer.address)],
      buyer.address
    );
    
    // Check structure of response
    const response = result.result.expectTuple();
    assertEquals(response.buyer, types.principal(buyer.address));
    const purchases = response.purchases.expectList();
    // Verify that we got a list (even if it's empty in this test)
    assertEquals(true, Array.isArray(purchases));
  }
});

// This test shows how expiration works
Clarinet.test({
  name: "listing is correctly identified as expired",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create a listing that expires soon
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-core",
        "set-test-listing",
        [types.uint(1), types.principal(mockListing.seller), types.uint(mockListing["price-per-btc"]), 
         types.uint(mockListing["btc-amount"]), types.uint(mockListing["stx-required"]), 
         types.ascii(mockListing["btc-address"]), types.bool(mockListing.active), 
         types.uint(10000), types.uint(11000)], // Expires at block 11000
        deployer.address
      )
    ]);
    
    // Mine blocks until after expiration
    chain.mineEmptyBlockUntil(12000);
    
    const result = chain.callReadOnlyFn(
      "marketplace-client",
      "get-listing-with-details",
      [types.uint(1)],
      deployer.address
    );
    
    const data = result.result.expectOk().expectTuple();
    // Should be expired since current height (12000) > expires-at (11000)
    assertEquals(data["is-expired"], types.bool(true));
  }
});

// Mock contracts needed for testing

// marketplace-core.clar
Clarinet.test({
  name: "Mock marketplace-core contract functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Here we would simulate adding implementations for the mock contracts
    // In a real environment, you would have separate test contracts
    
    // For example, adding a mock get-listing function to marketplace-core
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-core",
        "mock-get-listing",
        [types.uint(1)],
        deployer.address
      )
    ]);
  }
});

// Note: In a real Clarinet test setup, you would need to create mock versions of:
// - marketplace-core.clar
// - marketplace-escrow.clar
// - marketplace-disputes.clar
// These would implement test versions of the functions called by marketplace-client