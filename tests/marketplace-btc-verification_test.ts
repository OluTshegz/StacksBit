import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assertThrows } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock data for testing
const mockTxId = "mock-tx-id"; // Placeholder for a mock Bitcoin transaction ID
const mockVerifiedTxId = "mock-verified-tx-id"; // Placeholder for a mock verified transaction ID

Clarinet.test({
  name: "is-tx-verified verifies if a BTC transaction is valid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Simulate a successful BTC verification
    const result = chain.callReadOnlyFn(
      "marketplace-btc-verification",
      "is-tx-verified",
      [
        types.buff(mockVerifiedTxId),
      ],
      deployer.address
    );
    
    // Expect the transaction to be verified (true)
    assertEquals(result.result.expectOk().expectBool(), true);
  }
});

Clarinet.test({
  name: "is-tx-verified returns false for invalid BTC transaction",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Simulate an invalid BTC transaction
    const result = chain.callReadOnlyFn(
      "marketplace-btc-verification",
      "is-tx-verified",
      [
        types.buff(mockTxId),
      ],
      deployer.address
    );
    
    // Expect the transaction to be unverified (false)
    assertEquals(result.result.expectOk().expectBool(), false);
  }
});
