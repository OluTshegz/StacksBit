import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "update-listing-status updates the listing status correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const newStatus = false; // Inactive status
    
    // Simulate an update to the listing's status
    const result = chain.callReadOnlyFn(
      "marketplace-core-helper",
      "update-listing-status",
      [
        types.uint(listingId),
        types.bool(newStatus)
      ],
      deployer.address
    );
    
    // Verify the status update
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "Helper Functions for Listing Status - successfully update listing status",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const newStatus = false; // Inactive status

    const result = chain.callReadOnlyFn(
      "marketplace-core-helper",
      "update-listing-status",
      [
        types.uint(listingId),
        types.bool(newStatus)
      ],
      deployer.address
    );

    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "Helper Functions for Listing Status - throw error for unauthorized status update",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const unauthorizedUser = accounts.get("wallet_1")!;
    const listingId = 1;
    const newStatus = false; // Inactive status

    const result = chain.callReadOnlyFn(
      "marketplace-core-helper",
      "update-listing-status",
      [
        types.uint(listingId),
        types.bool(newStatus)
      ],
      unauthorizedUser.address
    );

    assertEquals(result.result.expectErr(), "Unauthorized");
  }
});
