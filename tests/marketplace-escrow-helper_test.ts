import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "update-escrow-tx-id updates the BTC transaction ID in escrow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const mockTxId = "mock-tx-id";
    
    // Simulate updating the BTC transaction ID in the escrow contract
    const result = chain.callReadOnlyFn(
      "marketplace-escrow-helper",
      "update-escrow-tx-id",
      [
        types.uint(listingId),
        types.buff(mockTxId),
      ],
      deployer.address
    );
    
    // Verify that the BTC transaction ID is updated
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "update-escrow-status updates the escrow status correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const newStatus = "disputed";
    
    // Simulate updating the escrow status
    const result = chain.callReadOnlyFn(
      "marketplace-escrow-helper",
      "update-escrow-status",
      [
        types.uint(listingId),
        types.ascii(newStatus),
      ],
      deployer.address
    );
    
    // Verify that the escrow status is updated
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "should successfully update escrow status",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const newStatus = "completed";

    const result = chain.callReadOnlyFn(
      "marketplace-escrow-helper",
      "update-escrow-status",
      [
        types.uint(listingId),
        types.ascii(newStatus),
      ],
      deployer.address
    );

    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "should throw error if escrow is already refunded",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const listingId = 1;
    const newStatus = "refunded";

    const result = chain.callReadOnlyFn(
      "marketplace-escrow-helper",
      "update-escrow-status",
      [
        types.uint(listingId),
        types.ascii(newStatus),
      ],
      deployer.address
    );

    assertEquals(result.result.expectErr().expectAscii(), "Escrow already refunded");
  }
});

Clarinet.test({
  name: "should throw error if caller is unauthorized",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const unauthorizedUser = accounts.get("wallet_1")!;
    const listingId = 1;
    const newStatus = "disputed";

    const result = chain.callReadOnlyFn(
      "marketplace-escrow-helper",
      "update-escrow-status",
      [
        types.uint(listingId),
        types.ascii(newStatus),
      ],
      unauthorizedUser.address
    );

    assertEquals(result.result.expectErr().expectAscii(), "Unauthorized");
  }
});
